import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/cleanup-sessions
 * Deletes expired sessions (older than 24h) to keep the sessions table lean.
 * Run periodically (every 6 hours).
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

		return NextResponse.json({
			status: "ok",
			deleted: count ?? 0,
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
