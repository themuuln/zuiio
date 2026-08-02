import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

/**
 * GET /api/flow/list?orgId=<id>
 *
 * Lists active + recent published flow versions for an org.
 * Internal API — no auth (reachable from the dashboard).
 *
 * Returns: { flows: Array<{ id, name, version, product_type, is_active, created_at }> }
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId");

	if (!orgId) {
		return NextResponse.json({ error: "orgId is required" }, { status: 400 });
	}

	const sb = createServiceClient();

	try {
		const { data, error } = await sb
			.from("flow_versions")
			.select("id, product_type, is_active, version, metadata, created_at")
			.eq("organization_id", orgId)
			.order("created_at", { ascending: false })
			.limit(50);

		if (error) {
			capture(error, { context: "agent-gateway: flow list" });
			return NextResponse.json(
				{ error: "Failed to list flows", details: error.message },
				{ status: 500 },
			);
		}

		const flows = (data ?? []).map((row) => ({
			id: row.id,
			name: row.metadata?.name ?? null,
			version: row.version,
			product_type: row.product_type,
			is_active: row.is_active,
			created_at: row.created_at,
		}));

		return NextResponse.json({ flows });
	} catch (err) {
		capture(err, { context: "agent-gateway: flow list" });
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
