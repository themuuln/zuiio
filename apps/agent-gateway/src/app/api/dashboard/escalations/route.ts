import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { listPendingHandoffs } from "@/state/handoff";

/** GET /api/dashboard/escalations?orgId=<id> */
export async function GET(request: Request) {
	const orgId = new URL(request.url).searchParams.get("orgId");
	if (!orgId) {
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	}

	const escalations = await listPendingHandoffs(createServiceClient(), orgId);
	return NextResponse.json({ escalations });
}
