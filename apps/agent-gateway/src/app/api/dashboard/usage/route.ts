import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getUsageStats } from "@/state/usage";

/**
 * GET /api/dashboard/usage?orgId=<id>&days=7
 * Returns usage statistics for a given organization.
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId");
	const days = parseInt(url.searchParams.get("days") ?? "7", 10);

	if (!orgId) {
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();
	const stats = await getUsageStats(sb, orgId, days);

	return NextResponse.json(stats);
}
