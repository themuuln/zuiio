import "server-only";

import { NextResponse } from "next/server";
import { TelegramChannel } from "@zuiio/gateway-telegram";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/cron/reminders
 * Sends pending reminder notifications via Telegram.
 * Runs every 5 minutes.
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
		// Find pending reminders
		const { data: reminders, error } = await sb
			.from("notifications")
			.select("id, message, organization_id")
			.eq("type", "reminder")
			.eq("is_read", false)
			.lte("scheduled_for", new Date().toISOString())
			.limit(50);

		if (error || !reminders || reminders.length === 0) {
			return NextResponse.json({ processed: 0 });
		}

		let processed = 0;
		for (const reminder of reminders) {
			try {
				// Find the telegram chat for this org
				const { data: link } = await sb
					.from("telegram_links")
					.select("telegram_chat_id")
					.eq("organization_id", reminder.organization_id)
					.eq("is_active", true)
					.limit(1)
					.single();

				if (link) {
					await tg.sendMessage(
						Number(link.telegram_chat_id),
						`🔔 <b>Сануулга</b>\n\n${reminder.message}`,
					);
				}

				// Mark as read
				await sb
					.from("notifications")
					.update({ is_read: true })
					.eq("id", reminder.id);

				processed++;
			} catch {
				// Skip failed reminders, continue with others
			}
		}

		return NextResponse.json({ processed });
	} catch {
		return NextResponse.json({ processed: 0 });
	}
}
