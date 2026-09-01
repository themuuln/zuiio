import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { FacebookChannel } from "@/channels/facebook";
import { TelegramChannel } from "@/channels/telegram";
import { WhatsAppChannel } from "@/channels/whatsapp";
import { decryptSecret } from "@/lib/crypto";
import { withResilientFetch } from "@/lib/resilience";
import { createServiceClient } from "@/lib/supabase";
import { resolveZerBaseUrl } from "@/lib/zer-resolver";

const QPAY_POLL_RESILIENCE_OPTIONS = {
	key: "qpay-poll-order-status",
	label: "QPay order status",
	maxRetries: 2,
	timeoutMs: 8000,
	concurrency: 4,
	queueCapacity: 16,
	throwOnNonOk: false,
} as const;
/**
 * GET /api/cron/qpay-poll
 * Polls pending QPay orders for 15min window, notifies on paid/expired.
 * Called by Vercel Cron every minute (see vercel.json). Requires CRON_SECRET if set.
 * Fallback for when Zer's QPay webhook doesn't arrive.
 */
export async function GET(request: Request) {
	const cronSecret = process.env.CRON_SECRET?.trim();
	if (cronSecret) {
		const auth = request.headers.get("authorization")?.trim() ?? "";
		if (auth !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
	}

	const sb = createServiceClient();
	const now = new Date().toISOString();

	// Fetch pending that haven't expired yet, limit 20 per run to avoid long loops
	const { data: pending, error } = await sb
		.from("qpay_pending")
		.select(
			"order_id, organization_id, psid, channel, channel_chat_id, trace_id, amount, expires_at",
		)
		.eq("status", "pending")
		.gt("expires_at", now)
		.order("created_at", { ascending: true })
		.limit(20);

	if (error) {
		capture(error, { context: "qpay-poll: select pending" });
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	if (!pending || pending.length === 0) {
		// Also expire old pending that passed expires_at without update
		await sb
			.from("qpay_pending")
			.update({ status: "expired" })
			.eq("status", "pending")
			.lt("expires_at", now);
		return NextResponse.json({ ok: true, checked: 0, expired: 0 });
	}

	let checked = 0;
	let notifiedPaid = 0;
	let notifiedExpired = 0;

	for (const row of pending) {
		checked++;
		const orderId = row.order_id as string;
		const orgId = row.organization_id as string;
		const psid = row.psid as string;
		const channel = row.channel as string;

		// Check if already expired (should have been filtered, but double-check)
		if (new Date(row.expires_at as string).getTime() < Date.now()) {
			await sb
				.from("qpay_pending")
				.update({ status: "expired" })
				.eq("order_id", orderId);
			// Notify expired will be handled next run or via webhook, but also notify here
			if (
				["messenger", "instagram", "telegram", "whatsapp"].includes(channel)
			) {
				const { data: conn } = await sb
					.from("channel_connections")
					.select("page_id, page_access_token")
					.eq("organization_id", orgId)
					.eq("channel", channel)
					.eq("is_active", true)
					.maybeSingle();
				if (conn || channel === "telegram" || channel === "whatsapp") {
					const pageId =
						(conn?.page_id as string | null) ?? (row.channel_chat_id as string);
					let pageToken: string | null = null;
					try {
						pageToken = decryptSecret(conn?.page_access_token as string);
					} catch {
						pageToken = conn?.page_access_token as string;
					}
					const ch =
						channel === "telegram"
							? new TelegramChannel()
							: channel === "whatsapp"
								? new WhatsAppChannel()
								: new FacebookChannel({
										pageId: pageId ?? undefined,
										pageAccessToken: pageToken ?? undefined,
									});
					try {
						await ch.sendMessage(
							psid,
							'⏰ QPay хугацаа дууссан.\n\nТөлбөр баталгаажаагүй тул захиалга цуцлагдлаа. Дахин захиалах бол "Бүтээгдэхүүн үзэх" дарна уу.',
							{
								quickReplies: [
									{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
								],
							},
						);
						notifiedExpired++;
					} catch (e) {
						capture(e, { context: "qpay-poll: notify expired" });
					}
				}
			}
			continue;
		}

		// Poll Zer for order status
		try {
			const baseUrl = await resolveZerBaseUrl(orgId, sb);
			if (!baseUrl) continue;
			const secret = process.env.AGENT_GATEWAY_API_SECRET?.trim();
			if (!secret) continue;
			const res = await withResilientFetch(
				`${baseUrl}/api/internal/v1/checkout/orders/${orderId}`,
				{
					method: "GET",
					headers: { "x-api-key": secret },
				},
				QPAY_POLL_RESILIENCE_OPTIONS,
			);
			if (!res.ok) continue;
			const json = (await res.json()) as {
				ok?: boolean;
				data?: { status?: string };
			};
			const status = json?.data?.status?.toLowerCase() ?? "";

			if (status === "paid" || status === "success" || status === "completed") {
				await sb
					.from("qpay_pending")
					.update({ status: "paid" })
					.eq("order_id", orderId);
				if (
					["messenger", "instagram", "telegram", "whatsapp"].includes(channel)
				) {
					const { data: conn } = await sb
						.from("channel_connections")
						.select("page_id, page_access_token")
						.eq("organization_id", orgId)
						.eq("channel", channel)
						.eq("is_active", true)
						.maybeSingle();
					if (conn || channel === "telegram" || channel === "whatsapp") {
						const pageId =
							(conn?.page_id as string | null) ??
							(row.channel_chat_id as string);
						let pageToken: string | null = null;
						try {
							pageToken = decryptSecret(conn?.page_access_token as string);
						} catch {
							pageToken = conn?.page_access_token as string;
						}
						const ch =
							channel === "telegram"
								? new TelegramChannel()
								: channel === "whatsapp"
									? new WhatsAppChannel()
									: new FacebookChannel({
											pageId: pageId ?? undefined,
											pageAccessToken: pageToken ?? undefined,
										});
						try {
							await ch.sendMessage(
								psid,
								`✅ Төлбөр амжилттай!\n\nЗахиалга #${orderId.slice(0, 8)} баталгаажлаа. Бид удахгүй бэлтгэж хүргэнэ.`,
								{
									quickReplies: [
										{ text: "Захиалга шалгах", callbackData: "order_status" },
										{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
									],
								},
							);
							notifiedPaid++;
						} catch (e) {
							capture(e, { context: "qpay-poll: notify paid" });
						}
					}
				}
			}
		} catch (e) {
			capture(e, { context: "qpay-poll: poll order", orderId });
		}
	}

	// Expire old pending that are now past expires_at
	const { count: expiredCount } = await sb
		.from("qpay_pending")
		.update({ status: "expired" }, { count: "exact" })
		.eq("status", "pending")
		.lt("expires_at", new Date().toISOString());

	return NextResponse.json({
		ok: true,
		checked,
		notifiedPaid,
		notifiedExpired,
		expired: expiredCount ?? 0,
	});
}
