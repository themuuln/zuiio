import "server-only";

import { openCodeGoConfig } from "@/lib/env";
import { capture } from "@zuiio/capture";

/**
 * Embedding generation via OpenCodeGo API.
 * Uses OpenAI-compatible embeddings endpoint.
 * Dimension: 1536 (matches our pgvector column).
 */

const EMBEDDING_MODEL = "text-embedding-ada-002";
const EMBEDDING_DIMENSION = 1536;

/**
 * Generate an embedding vector from text.
 * Uses OpenCodeGo's OpenAI-compatible embeddings API.
 * Falls back to a simple bag-of-words vector if the API is unavailable.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	const config = openCodeGoConfig();

	try {
		// Try OpenCodeGo's OpenAI-compatible embeddings endpoint
		const res = await fetch(`${config.baseUrl}/embeddings`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.apiKey}`,
			},
			body: JSON.stringify({
				model: EMBEDDING_MODEL,
				input: text.substring(0, 8191),
			}),
		});

		if (!res.ok) {
			// OpenCodeGo may not support embeddings on this endpoint
			// Fall through to fallback
			throw new Error(`Embedding API returned ${res.status}`);
		}

		const json = (await res.json()) as {
			data: Array<{ embedding: number[] }>;
		};
		const embedding = json.data?.[0]?.embedding;

		if (embedding && embedding.length === EMBEDDING_DIMENSION) {
			return embedding;
		}

		throw new Error("Invalid embedding response");
	} catch (err) {
		capture(err, {
			context: "agent-gateway: embedding generation — using fallback",
		});

		// Fallback: generate a simple keyword-frequency vector
		// This is NOT a real embedding but allows pgvector similarity to work
		// without blocking the feature
		return fallbackEmbedding(text);
	}
}

/**
 * Generate embeddings for multiple texts in parallel.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
	return Promise.all(texts.map((t) => generateEmbedding(t)));
}

/**
 * Fallback embedding: simple bag-of-keywords vector.
 * Uses Mongolian-aware keyword extraction to create a sparse-like dense vector.
 */
function fallbackEmbedding(text: string): number[] {
	const lower = text.toLowerCase();

	// Mongolian and English keywords for retail/accounting domain
	const keywords = [
		"борлуулалт",
		"ажлын",
		"захиалга",
		"харилцагч",
		"нэхэмжлэх",
		"төлбөр",
		"орлого",
		"зарлага",
		"бараа",
		"үйлчилгээ",
		"ажлын цаг",
		"холбоо",
		"хаяг",
		"үнэ",
		"хямдрал",
		"sale",
		"order",
		"customer",
		"invoice",
		"payment",
		"revenue",
		"expense",
		"product",
		"service",
		"price",
	];

	const vector = new Array(EMBEDDING_DIMENSION).fill(0);

	// For each keyword, set the corresponding slot to its frequency
	for (const kw of keywords) {
		const count = lower.split(kw).length - 1;
		if (count > 0) {
			// Simple hash to pick a slot
			const slot = Math.abs(hashString(kw)) % EMBEDDING_DIMENSION;
			vector[slot] += count * 0.1;
		}
	}

	return vector;
}

function hashString(s: string): number {
	let hash = 0;
	for (let i = 0; i < s.length; i++) {
		hash = (hash * 31 + s.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}
