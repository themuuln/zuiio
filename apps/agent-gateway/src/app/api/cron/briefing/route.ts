import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { TelegramChannel } from "@/channels/telegram";

export const runtime = "nodejs";

/**
 * GET /api/cron/briefing
 * Sends a morning summary to org owners via Telegram.
 * Runs daily at 8:00 AM Mongolia time (UTC+8 = 00:00 UTC).
 */
export async function GET(request: Request): Promise<NextResponse> {
	// Verify cron secret
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sb = createServiceClient();
	const tg = new TelegramChannel();

	try {
		// Get all active orgs with Telegram links
		const { data: links } = await sb
			.from("telegram_links")
			.select("organization_id, telegram_chat_id")
			.eq("is_active", true);

		if (!links || links.length === 0) {
			return NextResponse.json({ sent: 0 });
		}

		const today = new Date().toISOString().split("T")[0];
		let sent = 0;

		for (const link of links) {
			try {
				const orgId = link.organization_id;
				const chatId = Number(link.telegram_chat_id);

				// Gather data in parallel
				const [workOrders, appointments, invoices, expenses] =
					await Promise.all([
						sb
							.from("work_orders")
							.select("id, status")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.not(
								"status",
								"in",
								'("delivered","cancelled","completed")',
							),
						sb
							.from("appointments")
							.select("id, scheduled_at, customers(full_name)")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.gte("scheduled_at", today)
							.lte("scheduled_at", `${today}T23:59:59Z`),
						sb
							.from("invoices")
							.select("id, total, balance_due")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.gt("balance_due", 0),
						sb
							.from("expenses")
							.select("amount")
							.eq("organization_id", orgId)
							.is("deleted_at", null)
							.gte("expense_date", today),
					]);

				const activeWO = (workOrders.data ?? []).length;
				const todayAppts = (appointments.data ?? []).length;
				const unpaidCount = (invoices.data ?? []).length;
				const unpaidTotal = (invoices.data ?? []).reduce(
					(s: number, r: Record<string, unknown>) =>
						s + (Number(r.balance_due) || 0),
					0,
				);
				const todayExpenses = (expenses.data ?? []).reduce(
					(s: number, r: Record<string, unknown>) =>
						s + (Number(r.amount) || 0),
					0,
				);

				const message = [
					`🌅 <b>Өгрийн мэдээ — ${today}</b>`,
					"",
					`📋 Идэвхтэй ажлын захиалга: <b>${activeWO}</b>`,
					`📅 Өнөөдрийн цаг захиалга: <b>${todayAppts}</b>`,
					`💰 Төлөгдөөгүй нэхэмжлэх: <b>${unpaidCount}</b> (${unpaidTotal.toLocaleString()}₮)`,
					`💸 Өнөөдрийн зарлага: <b>${todayExpenses.toLocaleString()}₮</b>`,
				].join("\n");

				await tg.sendMessage(chatId, message);
				sent++;
			} catch {
				// Skip failed briefings
			}
		}

		return NextResponse.json({ sent });
	} catch {
		return NextResponse.json({ sent: 0 });
	}
}
