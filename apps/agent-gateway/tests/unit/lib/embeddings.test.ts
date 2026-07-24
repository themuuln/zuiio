import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
	openCodeGoConfig: vi.fn().mockReturnValue({
		apiKey: "test-api-key",
		baseUrl: "https://api.opencode.ai/v1",
		model: "text-embedding-ada-002",
	}),
}));

describe("generateEmbedding", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("calls the OpenCodeGo embeddings API and returns a vector", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					data: [{ embedding: [0.1, 0.2, 0.3] }],
				}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { generateEmbedding } = await import("@/lib/embeddings");

		const result = await generateEmbedding("test text");

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		expect(mockFetch).toHaveBeenCalled();
	});

	it("falls back to keyword-based vector on API failure", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
		});
		vi.stubGlobal("fetch", mockFetch);

		const { generateEmbedding } = await import("@/lib/embeddings");

		const result = await generateEmbedding("some Mongolian text");

		// Should return a fallback vector of default dimension
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(1536);
	});

	it("falls back on network error", async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
		vi.stubGlobal("fetch", mockFetch);

		const { generateEmbedding } = await import("@/lib/embeddings");

		const result = await generateEmbedding("test");

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(1536);
	});
});

describe("generateEmbeddings", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("generates embeddings for multiple texts in parallel", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					data: [{ embedding: [0.1, 0.2, 0.3] }],
				}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { generateEmbeddings } = await import("@/lib/embeddings");

		const results = await generateEmbeddings(["text1", "text2", "text3"]);

		expect(results).toHaveLength(3);
		expect(mockFetch).toHaveBeenCalledTimes(3);
	});
});

describe("fallbackEmbedding", () => {
	it("produces a deterministic vector of correct dimension", async () => {
		vi.mock("@/lib/env", () => ({
			openCodeGoConfig: vi.fn().mockReturnValue({
				apiKey: "test-api-key",
				baseUrl: "https://api.opencode.ai/v1",
				model: "text-embedding-ada-002",
			}),
		}));

		// Force API failure to test fallback
		const mockFetch = vi.fn().mockRejectedValue(new Error("API error"));
		vi.stubGlobal("fetch", mockFetch);

		const { generateEmbedding } = await import("@/lib/embeddings");

		const result1 = await generateEmbedding("Монгол бизнес");
		const result2 = await generateEmbedding("Монгол бизнес");

		expect(result1).toHaveLength(1536);
		// Same input should produce same fallback
		expect(result1).toEqual(result2);
	});

	it("produces different vectors for different texts", async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error("API error"));
		vi.stubGlobal("fetch", mockFetch);

		const { generateEmbedding } = await import("@/lib/embeddings");

		const result1 = await generateEmbedding("захиалга");
		const result2 = await generateEmbedding("борлуулалт");

		// Different keywords should produce different vectors
		const diff = result1.some((v, i) => v !== result2[i]);
		expect(diff).toBe(true);
	});
});
