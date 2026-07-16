import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { gatherBriefingData, logBriefing } from "@/state/briefing";

export const runtime = "nodejs";

/**
 * POST /api/cron/briefing
 * Runs daily at 8:00 AM Mongolia time (UTC+8 = 00:00 UTC).
 * Loops through all organizations with telegram_links and sends a morning briefing.
 */
export async function GET(request: Request) {
	// Verify cron secret
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sb = createServiceClient();
	const results: Array<{ orgId: string; success: boolean; error?: string }> =
		[];

	try {
		// Get all orgs with active telegram links
		const { data: links } = await sb
			.from("telegram_links")
			.select("organization_id, telegram_chat_id")
			.eq("is_active", true);

		if (!links || links.length === 0) {
			return NextResponse.json({
				status: "ok",
				briefingCount: 0,
				message: "No active organizations found",
			});
		}

		// Deduplicate by org
		const orgs = new Map<string, number>();
		for (const link of links as Array<{
			organization_id: string;
			telegram_chat_id: number;
		}>) {
			if (!orgs.has(link.organization_id)) {
				orgs.set(link.organization_id, link.telegram_chat_id);
			}
		}

		// Gather and send briefings
		for (const [orgId, adminChatId] of orgs) {
			try {
				const data = await gatherBriefingData(sb, orgId, adminChatId);
				if (!data) continue;

				// Build briefing message
				const briefingLines = [
					`☀️ **Өглөөний хураангуй — ${data.orgName}**`,
					`📅 ${data.date}`,
					"",
					`📊 **Өчигдрийн тойм:**`,
					`• Идэвхтэй харилцаа: ${data.overnightMessages} мессеж`,
					`• Багажийн дуудлага: ${data.overnightToolCalls} удаа`,
					`• Шийдвэрлэгдээгүй: ${data.pendingHandoffs} хүнд шилжүүлэлт`,
					"",
				];

				if (data.topQueries.length > 0) {
					briefingLines.push("🔝 **Хамгийн их асуугдсан:**");
					for (const q of data.topQueries) {
						briefingLines.push(`  • ${q}`);
					}
					briefingLines.push("");
				}

				if (data.anomalies.length > 0) {
					briefingLines.push("⚠️ **Анхаарах асуудлууд:**");
					for (const a of data.anomalies) {
						briefingLines.push(`  • ${a}`);
					}
					briefingLines.push("");
				}

				briefingLines.push("💡 Бүрэн тайлан харах: /dashboard");

				const briefingText = briefingLines.join("\n");

				// Send via Telegram
				const botToken = process.env.TELEGRAM_BOT_TOKEN;
				if (botToken) {
					await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							chat_id: adminChatId,
							text: briefingText,
							parse_mode: "Markdown",
						}),
					});
				}

				// Log briefing delivery
				await logBriefing(sb, data, briefingText, adminChatId);

				results.push({ orgId, success: true });
			} catch (err) {
				results.push({
					orgId,
					success: false,
					error: err instanceof Error ? err.message : "Unknown error",
				});
			}
		}

		return NextResponse.json({
			status: "ok",
			briefingCount: results.length,
			succeeded: results.filter((r) => r.success).length,
			failed: results.filter((r) => !r.success).length,
			results,
		});
	} catch (err) {
		return NextResponse.json(
			{
				status: "error",
				error: err instanceof Error ? err.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
