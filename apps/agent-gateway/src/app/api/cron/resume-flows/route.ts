import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { FacebookChannel } from "@/channels/facebook";
import { TelegramChannel } from "@/channels/telegram";
import { resumeDelayedFlows } from "@/flow-executor";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/resume-flows
 *
 * Resumes delayed flow nodes (delays that have passed).
 * Run every 5 minutes via cron.
 *
 * Checks flow_wait_states for delayed waits where scheduled_at <= now,
 * then resumes the conversation run from that point.
 */
export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sb = createServiceClient();

	try {
		const resumed = await resumeDelayedFlows(sb, createChannelForRun);

		return NextResponse.json({
			status: "ok",
			resumed,
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: cron resume-flows" });
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

/**
 * Factory function: creates the appropriate channel adapter based on
 * the channel type stored in the conversation run.
 */
function createChannelForRun(channel: string, meta?: Record<string, unknown>) {
	switch (channel) {
		case "telegram":
			return new TelegramChannel();
		case "messenger":
		case "instagram":
			return new FacebookChannel({
				pageId: meta?.pageId as string,
				pageAccessToken: meta?.pageAccessToken as string,
			});
		default:
			return new TelegramChannel();
	}
}
