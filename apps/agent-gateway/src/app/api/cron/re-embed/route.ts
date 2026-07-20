import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/re-embed
 * Re-generates embeddings for knowledge sources that don't have one.
 * Run periodically (daily) to catch sources ingested during API outages.
 */
export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sb = createServiceClient();
	let embedded = 0;
	let failed = 0;

	try {
		// Find sources without embeddings
		const { data: sources } = await sb
			.from("agent_knowledge_sources")
			.select("id, content")
			.is("embedding", null)
			.eq("is_active", true)
			.limit(50); // Process in batches

		if (sources && sources.length > 0) {
			for (const source of sources as Array<{ id: string; content: string }>) {
				try {
					const embedding = await generateEmbedding(source.content);
					await sb
						.from("agent_knowledge_sources")
						.update({ embedding, updated_at: new Date().toISOString() })
						.eq("id", source.id);
					embedded++;
				} catch {
					failed++;
				}
			}
		}

		return NextResponse.json({
			status: "ok",
			processed: (sources ?? []).length,
			embedded,
			failed,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: cron re-embed" });
		return NextResponse.json(
			{ status: "error", error: "Failed to re-embed sources" },
			{ status: 500 },
		);
	}
}
