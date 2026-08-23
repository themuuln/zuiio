import "server-only";

import { capture } from "@zuiio/capture";
import type { GatewayContext } from "@zuiio/gateway-core";
import { TelegramChannel } from "@zuiio/gateway-telegram";
import { WhatsAppChannel } from "@zuiio/gateway-whatsapp";
import { NextResponse } from "next/server";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { createServiceClient } from "@/lib/supabase";
import { claimJobs, completeJob, type JobPayload } from "@/state/job-queue";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/process-jobs
 *
 * Drains the durable agent_async_jobs queue: claims up to 5 pending jobs,
 * runs the agent, and delivers the reply via the originating channel.
 * Registered in vercel.json to run every 5 minutes.
 */
export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sb = createServiceClient();

	try {
		const jobs = await claimJobs(sb, 5);

		let processed = 0;
		let failed = 0;

		for (const job of jobs) {
			const payload = job.payload as JobPayload;
			try {
				const response = await handleAgentMessage(
					payload.ctx,
					payload.text,
					payload.chatType,
					{
						getSystemPrompt: systemPromptFor,
						getTools: (toolCtx) =>
							getProductTools(payload.productType, toolCtx),
					},
				);

				await deliverReply(payload.ctx, response);
				await completeJob(sb, job.id);
				processed++;
			} catch (err) {
				failed++;
				capture(err, { context: "agent-gateway: process async job" });
				const message =
					err instanceof Error ? err.message : "Unknown job failure";
				await completeJob(sb, job.id, message);
			}
		}

		return NextResponse.json({ status: "ok", processed, failed });
	} catch (err) {
		capture(err, { context: "agent-gateway: process-jobs cron" });
		return NextResponse.json(
			{
				status: "error",
				error: err instanceof Error ? err.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/** Deliver a completed agent reply via the channel that originated the job. */
async function deliverReply(ctx: GatewayContext, reply: string): Promise<void> {
	switch (ctx.channel) {
		case "whatsapp":
			await new WhatsAppChannel().sendMessage(ctx.channelChatId, reply);
			return;
		default:
			await new TelegramChannel().sendMessage(ctx.channelChatId, reply);
	}
}
