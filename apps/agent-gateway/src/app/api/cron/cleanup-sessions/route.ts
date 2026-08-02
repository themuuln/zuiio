import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { resolveStaleHandoffs } from "@/state/handoff";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/cleanup-sessions
 * Deletes expired sessions (older than 24h) and auto-resolves handoffs stuck
 * in pending_human for more than 24h.
 * Run periodically (daily via vercel.json crons).
 */
export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sb = createServiceClient();
	const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

	try {
		const { count, error } = await sb
			.from("agent_sessions")
			.delete()
			.lt("updated_at", cutoff);

		if (error) {
			return NextResponse.json(
				{ status: "error", error: error.message },
				{ status: 500 },
			);
		}

		// Auto-resolve stale pending handoffs (no human picked them up).
		const staleResolved = await resolveStaleHandoffs(sb, cutoff);

		return NextResponse.json({
			status: "ok",
			deleted: count ?? 0,
			staleHandoffsResolved: staleResolved,
			cutoff,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: cron cleanup-sessions" });
		return NextResponse.json(
			{ status: "error", error: "Failed to clean up sessions" },
			{ status: 500 },
		);
	}
}
