import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { FacebookChannel } from "@/channels/facebook";
import { TelegramChannel } from "@/channels/telegram";
import { WhatsAppChannel } from "@/channels/whatsapp";
import { createServiceClient } from "@/lib/supabase";

/**
 * POST /api/qpay/webhook
 * Called by Zer when QPay invoice status changes (paid/expired).
 * Body: { order_id: string (uuid), status: "paid"|"expired"|"failed", amount?: number }
 * Auth: x-qpay-signature = HMAC-SHA256 hex of rawBody with QPAY_WEBHOOK_SECRET (or AGENT_GATEWAY_API_SECRET fallback)
 * Also accepts x-api-key = AGENT_GATEWAY_API_SECRET for Zer internal calls.
 *
 * On paid: look up qpay_pending by order_id, send Messenger confirmation, mark pending paid, clear expires.
 * On expired/failed: notify user that QPay expired.
 *
 * Must be idempotent — Zer may retry.
 */
export async function POST(request: Request) {
	const rawBody = await request.text();
	let body: { order_id?: string; status?: string; amount?: number };
	try {
		body = JSON.parse(rawBody) as typeof body;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
	const status =
		typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
	if (!orderId || !status) {
		return NextResponse.json(
			{ error: "order_id and status required" },
			{ status: 400 },
		);
	}

	// Auth: prefer QPAY_WEBHOOK_SECRET, fallback to AGENT_GATEWAY_API_SECRET, also allow x-api-key for internal Zer calls
	const secret =
		process.env.QPAY_WEBHOOK_SECRET?.trim() ||
		process.env.AGENT_GATEWAY_API_SECRET?.trim() ||
		"";
	const sig = request.headers.get("x-qpay-signature")?.trim() ?? "";
	const apiKey = request.headers.get("x-api-key")?.trim() ?? "";

	let authed = false;
	if (secret && sig) {
		try {
			const { createHmac, timingSafeEqual } = await import("node:crypto");
			const expected = createHmac("sha256", secret)
				.update(rawBody, "utf8")
				.digest("hex");
			authed = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
		} catch {
			authed = false;
		}
	}
	if (!authed && secret && apiKey) {
		authed = apiKey === secret;
	}
	// Fail-closed if secret is configured but auth failed; allow open if no secret (dev)
	if (secret && !authed) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	const sb = createServiceClient();
	const { data: pending, error: selErr } = await sb
		.from("qpay_pending")
		.select(
			"order_id, psid, channel, channel_chat_id, organization_id, trace_id, status, expires_at",
		)
		.eq("order_id", orderId)
		.maybeSingle();

	if (selErr) {
		capture(selErr, { context: "qpay-webhook: select pending" });
		return NextResponse.json({ error: "DB error" }, { status: 500 });
	}
	if (!pending) {
		// Already handled or not found — idempotent ok
		return NextResponse.json({ ok: true, note: "not pending" });
	}
	if (pending.status !== "pending") {
		return NextResponse.json({ ok: true, note: `already ${pending.status}` });
	}

	// Resolve page token for Messenger
	const { data: conn } = await sb
		.from("channel_connections")
		.select("page_id, page_access_token, last_user_message_at")
		.eq("organization_id", pending.organization_id)
		.eq("channel", pending.channel)
		.eq("is_active", true)
		.maybeSingle();

	let pageId: string | null = null;
	let pageToken: string | null = null;
	if (conn) {
		pageId =
			(conn.page_id as string | null) ??
			(pending.channel_chat_id as string | null);
		const rawTok = conn.page_access_token as string | null;
		if (rawTok) {
			try {
				const { decryptSecret } = await import("@/lib/crypto");
				pageToken = decryptSecret(rawTok);
			} catch {
				pageToken = rawTok;
			}
		}
	}

	const lastMessage = conn?.last_user_message_at as string | null | undefined;
	const withinMessagingWindow =
		!lastMessage ||
		Date.now() - new Date(lastMessage).getTime() <= 24 * 60 * 60 * 1000;
	if (
		(pending.channel === "messenger" || pending.channel === "instagram") &&
		!withinMessagingWindow
	) {
		return NextResponse.json({
			ok: true,
			notified: false,
			note: "24h messaging window expired",
		});
	}

	const isPaid = status === "paid" || status === "success";
	const isExpired =
		status === "expired" || status === "failed" || status === "timeout";

	if (isPaid) {
		// Mark paid
		await sb
			.from("qpay_pending")
			.update({ status: "paid" })
			.eq("order_id", orderId);

		// Notify user on Messenger/Instagram
		if (
			["messenger", "instagram", "telegram", "whatsapp"].includes(
				pending.channel,
			)
		) {
			const ch =
				pending.channel === "telegram"
					? new TelegramChannel()
					: pending.channel === "whatsapp"
						? new WhatsAppChannel()
						: new FacebookChannel({
								pageId: pageId ?? undefined,
								pageAccessToken: pageToken ?? undefined,
							});
			const msg =
				"✅ Төлбөр амжилттай!\n\n" +
				`Захиалга #${orderId.slice(0, 8)} баталгаажлаа. Бид удахгүй бэлтгэж хүргэнэ.\n` +
				`Дэлгэрэнгүйг "Захиалга шалгах" товчоор харна уу.`;
			try {
				await ch.sendMessage(pending.psid, msg, {
					quickReplies: [
						{ text: "Захиалга шалгах", callbackData: "order_status" },
						{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
					],
				});
			} catch (e) {
				capture(e, { context: "qpay-webhook: notify paid" });
			}
		}
		return NextResponse.json({ ok: true, notified: true });
	}

	if (isExpired) {
		await sb
			.from("qpay_pending")
			.update({ status: "expired" })
			.eq("order_id", orderId);
		if (
			["messenger", "instagram", "telegram", "whatsapp"].includes(
				pending.channel,
			)
		) {
			const ch =
				pending.channel === "telegram"
					? new TelegramChannel()
					: pending.channel === "whatsapp"
						? new WhatsAppChannel()
						: new FacebookChannel({
								pageId: pageId ?? undefined,
								pageAccessToken: pageToken ?? undefined,
							});
			try {
				await ch.sendMessage(
					pending.psid,
					'⏰ QPay хугацаа дууссан.\n\nТөлбөр баталгаажаагүй тул захиалга цуцлагдлаа. Дахин захиалах бол "Бүтээгдэхүүн үзэх" дарна уу.',
					{
						quickReplies: [
							{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
						],
					},
				);
			} catch (e) {
				capture(e, { context: "qpay-webhook: notify expired" });
			}
		}
		return NextResponse.json({ ok: true, notified: true });
	}

	return NextResponse.json({ ok: true, note: `unhandled status ${status}` });
}
