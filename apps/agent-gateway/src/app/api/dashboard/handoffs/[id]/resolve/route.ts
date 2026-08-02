import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { resolveHandoff } from "@/state/handoff";

/**
 * POST /api/dashboard/handoffs/[id]/resolve
 * Marks a pending handoff as resolved by a human.
 * Protected by the dashboard middleware (DASHBOARD_SECRET).
 */
export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	if (!id) {
		return NextResponse.json(
			{ error: "handoff id is required" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();
	await resolveHandoff(sb, id);

	return NextResponse.json({ ok: true });
}
