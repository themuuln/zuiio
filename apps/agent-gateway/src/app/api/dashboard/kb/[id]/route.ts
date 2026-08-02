import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

/**
 * DELETE /api/dashboard/kb/[id]?orgId=<id>
 * Soft-deletes a knowledge source (is_active = false).
 * Protected by the dashboard middleware (DASHBOARD_SECRET).
 */
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId");

	if (!id || !orgId) {
		return NextResponse.json(
			{ error: "id and orgId are required" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();
	const { error } = await sb
		.from("agent_knowledge_sources")
		.update({ is_active: false, updated_at: new Date().toISOString() })
		.eq("id", id)
		.eq("organization_id", orgId);

	if (error) {
		capture(error, { context: "agent-gateway: kb delete" });
		return NextResponse.json(
			{ error: "Failed to delete knowledge source" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true });
}
