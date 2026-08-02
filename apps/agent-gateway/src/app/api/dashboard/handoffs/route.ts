import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { listPendingHandoffs } from "@/state/handoff";

/**
 * GET /api/dashboard/handoffs?orgId=<id>
 * Lists pending human handoffs for an org (team inbox).
 * Protected by the dashboard middleware (DASHBOARD_SECRET).
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
	const handoffs = await listPendingHandoffs(sb, orgId);

	return NextResponse.json({ handoffs });
}
