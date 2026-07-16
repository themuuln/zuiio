import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { resolveOrgFromChatUser } from "@/gateway/mode-a";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/drain-queue
 *
 * Processes pending updates from the Cloudflare Worker queue.
 * Run on startup and periodically (every 30s via cron).
 *
 * This catches messages that arrived while the MacBook was rebooting.
 */
export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sb = createServiceClient();

	try {
		// Fetch unprocessed updates (oldest first)
		const { data: pending, error } = await sb
			.from("pending_updates")
			.select("id, raw_json")
			.eq("processed", false)
			.order("created_at", { ascending: true })
			.limit(10); // Process in batches of 10

		if (error) {
			return NextResponse.json(
				{ status: "error", error: error.message },
				{ status: 500 },
			);
		}

		if (!pending || pending.length === 0) {
			return NextResponse.json({ status: "ok", processed: 0 });
		}

		let processed = 0;
		let failed = 0;

		for (const item of pending) {
			try {
				const update = item.raw_json as {
					message?: {
						chat: { id: number; type: string };
						from?: { id: number };
						text?: string;
						message_id: number;
					};
				};

				if (!update.message?.text) {
					// Not a text message — mark as processed
					await markProcessed(sb, item.id);
					processed++;
					continue;
				}

				const chatId = update.message.chat.id;
				const userId = update.message.from?.id ?? 0;
				const text = update.message.text;
				const chatType = update.message.chat.type;

				// Resolve org
				const resolved = await resolveOrgFromChatUser(sb, chatId, userId);
				const { productType } = resolved.context;

				// Process through agent
				await handleAgentMessage(
					resolved.context,
					text,
					chatType,
					{
						getSystemPrompt: systemPromptFor,
						getTools: (ctx) => getProductTools(productType, ctx),
					},
				);

				await markProcessed(sb, item.id);
				processed++;
			} catch {
				failed++;
				// Don't mark as processed — will retry on next drain
			}
		}

		return NextResponse.json({
			status: "ok",
			processed,
			failed,
			remaining: pending.length - processed - failed,
		});
	} catch (err) {
		return NextResponse.json(
			{ status: "error", error: String(err) },
			{ status: 500 },
		);
	}
}

async function markProcessed(
	sb: ReturnType<typeof createServiceClient>,
	id: number,
): Promise<void> {
	await sb
		.from("pending_updates")
		.update({
			processed: true,
			processed_at: new Date().toISOString(),
		})
		.eq("id", id);
}
