import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";

/**
 * Knowledge base retrieval for agent context.
 * Uses pgvector similarity search to find relevant knowledge chunks.
 */

export interface KnowledgeChunk {
	id: string;
	sourceType: string;
	title: string | null;
	content: string;
	similarity: number;
}

/**
 * Search knowledge base for relevant content using vector similarity.
 * Falls back to text ILIKE search if no embedding is provided (or function unavailable).
 */
export async function searchKnowledge(
	supabase: SupabaseClient,
	orgId: string,
	query: string,
	options?: { limit?: number; embeddings?: number[] },
): Promise<KnowledgeChunk[]> {
	const limit = options?.limit ?? 5;
	const embedding = options?.embeddings;

	// Try pgvector similarity first
	if (embedding && embedding.length === 1536) {
		try {
			const { data, error } = await supabase.rpc("search_agent_knowledge", {
				p_org_id: orgId,
				p_query_embedding: embedding,
				p_limit: limit,
				p_similarity_threshold: 0.7,
			});

			if (!error && data) {
				return (data as Array<Record<string, unknown>>).map((row) => ({
					id: row.id as string,
					sourceType: row.source_type as string,
					title: row.title as string | null,
					content: row.content as string,
					similarity: row.similarity as number,
				}));
			}
		} catch {
			// pgvector may not be available — fall back to text search
		}
	}

	// Fallback: text-based ILIKE search
	const { data } = await supabase
		.from("agent_knowledge_sources")
		.select("id, source_type, title, content")
		.eq("organization_id", orgId)
		.eq("is_active", true)
		.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
		.limit(limit);

	return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
		id: row.id as string,
		sourceType: row.source_type as string,
		title: row.title as string | null,
		content: row.content as string,
		similarity: 0.5, // placeholder for text match
	}));
}

/**
 * Ingest a new knowledge source into the knowledge base.
 * Automatically generates embeddings if not provided.
 */
export async function ingestKnowledge(
	supabase: SupabaseClient,
	orgId: string,
	params: {
		sourceType: string;
		title?: string;
		content: string;
		url?: string;
		embedding?: number[];
	},
): Promise<string> {
	// Generate embedding if not provided
	let embedding = params.embedding ?? null;
	if (!embedding) {
		try {
			const { generateEmbedding } = await import("@/lib/embeddings");
			embedding = await generateEmbedding(params.content);
		} catch {
			// Embedding generation failed — store without, cron will re-embed
		}
	}

	const { data, error } = await supabase
		.from("agent_knowledge_sources")
		.insert({
			organization_id: orgId,
			source_type: params.sourceType,
			title: params.title ?? null,
			content: params.content,
			url: params.url ?? null,
			embedding,
		})
		.select("id")
		.single();

	if (error) {
		capture(error, { context: "agent-gateway: knowledge ingest" });
		throw new Error("Мэдлэгийн санд бүртгэхэд алдаа гарлаа");
	}

	return (data as { id: string }).id;
}

/**
 * Generate a knowledge context string for injection into system prompt.
 */
export function formatKnowledgeContext(chunks: KnowledgeChunk[]): string {
	if (chunks.length === 0) return "";

	const formatted = chunks
		.map(
			(chunk, i) =>
				`[Мэдлэг ${i + 1}]${chunk.title ? ` (${chunk.title})` : ""}: ${chunk.content}`,
		)
		.join("\n\n");

	return `\n--- Бизнесийн мэдлэгийн сан ---\n${formatted}\n--- Мэдлэгийн сан дууслаа ---\n\nДээрх мэдлэгийн сангаас хамааралтай мэдээллийг хариултандаа ашиглана уу.`;
}
