import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { DAILY_LIMITS } from "@/state/budget";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/quota?orgId=<id>
 *
 * Returns today's token/API usage vs. the configured daily soft/hard limits.
 * Auth is the dashboard middleware cookie gate — this route lives under
 * /api/dashboard.
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId");

	if (!orgId) {
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();
	const today = new Date().toISOString().slice(0, 10);

	const { data, error } = await sb
		.from("agent_daily_spend")
		.select("tokens_used, api_calls")
		.eq("organization_id", orgId)
		.eq("date", today)
		.single();

	// PGRST116 = no spend row yet today — treat as zero usage, not an error.
	if (error && error.code !== "PGRST116") {
		capture(error, { context: "agent-gateway: dashboard quota" });
	}

	const tokensUsed = (data?.tokens_used as number) ?? 0;
	const apiCalls = (data?.api_calls as number) ?? 0;

	// The daily budget resets at midnight UTC (the spend `date` column is
	// UTC-based), so the reset moment is the next UTC midnight.
	const resetAt = new Date();
	resetAt.setUTCHours(24, 0, 0, 0);

	return NextResponse.json({
		softLimitTokens: DAILY_LIMITS.softCapTokens,
		hardLimitTokens: DAILY_LIMITS.hardCapTokens,
		tokensUsed,
		apiCalls,
		resetDate: resetAt.toISOString(),
		allowed: tokensUsed < DAILY_LIMITS.hardCapTokens,
	});
}
