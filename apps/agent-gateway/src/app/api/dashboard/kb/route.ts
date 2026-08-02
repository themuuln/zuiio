import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { ingestKnowledge } from "@/state/knowledge";

/**
 * GET /api/dashboard/kb?orgId=<id>
 * Lists active knowledge sources for an org (dashboard KB management).
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
	const { data, error } = await sb
		.from("agent_knowledge_sources")
		.select("id, title, source_type, visibility, created_at")
		.eq("organization_id", orgId)
		.eq("is_active", true)
		.order("created_at", { ascending: false });

	if (error) {
		capture(error, { context: "agent-gateway: kb list" });
		return NextResponse.json(
			{ error: "Failed to list knowledge sources" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ sources: data ?? [] });
}

/**
 * POST /api/dashboard/kb
 * Ingests a new knowledge source for an org.
 *
 * Body: { orgId, sourceType, title?, content, url?, visibility? }
 * visibility: "internal" | "customer" | "both" (default "internal").
 * Protected by the dashboard middleware (DASHBOARD_SECRET).
 */
export async function POST(request: Request) {
	let body: {
		orgId?: string;
		sourceType?: string;
		title?: string;
		content?: string;
		url?: string;
		visibility?: "internal" | "customer" | "both";
	};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const { orgId, sourceType, title, content, url, visibility } = body;
	if (!orgId || !sourceType || !content) {
		return NextResponse.json(
			{ error: "orgId, sourceType and content are required" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();
	try {
		// ingestKnowledge captures DB errors itself and generates embeddings.
		const id = await ingestKnowledge(sb, orgId, {
			sourceType,
			title,
			content,
			url,
		});

		// ingestKnowledge defaults visibility to "internal"; apply an explicit
		// audience after insert when the caller asked for something else.
		if (visibility && visibility !== "internal") {
			const { error: visError } = await sb
				.from("agent_knowledge_sources")
				.update({ visibility })
				.eq("id", id);
			if (visError) {
				capture(visError, {
					context: "agent-gateway: kb visibility update",
				});
			}
		}

		return NextResponse.json({ id });
	} catch {
		return NextResponse.json(
			{ error: "Failed to ingest knowledge source" },
			{ status: 500 },
		);
	}
}
