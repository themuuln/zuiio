import { describe, expect, it, vi } from "vitest";
import { searchKnowledge } from "@/state/knowledge";
import { TEST_ORG_ID } from "../fixtures/supabase-mock";

// Mock dependencies
vi.mock("server-only", () => ({}));
vi.mock("@/lib/redis", () => ({ getRedis: vi.fn(() => null) }));
vi.mock("@/lib/env", () => ({ getDeepseekConfig: vi.fn(() => null) }));
vi.mock("@/lib/embeddings", () => ({ generateEmbedding: vi.fn() }));

/**
 * Create a mock Supabase client that tracks .or() calls and falls through
 * to the ILIKE path (no .rpc defined → pgvector path throws → catch falls back).
 *
 * Returns the supabase mock and an array of all strings passed to `.or()`.
 */
function createTrackedSupabase() {
	const orCalls: string[] = [];
	const chain: Record<string, unknown> = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		or: vi.fn((condition: string) => {
			orCalls.push(condition);
			return chain;
		}),
		limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
		maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
		single: vi.fn(() => Promise.resolve({ data: null, error: null })),
		range: vi.fn(() => chain),
		order: vi.fn(() => chain),
	};
	const from = vi.fn(() => chain);
	return {
		supabase: { from, ...chain } as never,
		orCalls,
	};
}

describe("searchKnowledge — visibility filtering", () => {
	it("internal audience retrieves internal and both visibility", async () => {
		const { supabase, orCalls } = createTrackedSupabase();

		await searchKnowledge(supabase, TEST_ORG_ID, "test", {
			audience: "internal",
		});

		// The visibility filter .or() should be one of the tracked calls
		const visibilityCall = orCalls.find((c) =>
			c.includes("visibility.eq.internal"),
		);
		expect(visibilityCall).toBeDefined();
		expect(visibilityCall).toContain("visibility.eq.internal");
		expect(visibilityCall).toContain("visibility.eq.both");
	});

	it("customer audience retrieves customer and both visibility", async () => {
		const { supabase, orCalls } = createTrackedSupabase();

		await searchKnowledge(supabase, TEST_ORG_ID, "test", {
			audience: "customer",
		});

		const visibilityCall = orCalls.find((c) =>
			c.includes("visibility.eq.customer"),
		);
		expect(visibilityCall).toBeDefined();
		expect(visibilityCall).toContain("visibility.eq.customer");
		expect(visibilityCall).toContain("visibility.eq.both");
	});

	it("no audience specified — no visibility filter applied", async () => {
		const { supabase, orCalls } = createTrackedSupabase();

		await searchKnowledge(supabase, TEST_ORG_ID, "test");

		// Should have exactly one .or() call — the content/title ILIKE filter
		expect(orCalls).toHaveLength(1);
		expect(orCalls[0]).toContain("title.ilike");
		expect(orCalls[0]).toContain("content.ilike");
		expect(orCalls[0]).not.toContain("visibility");
	});

	it("returns empty array when no ILIKE matches — with audience", async () => {
		const { supabase, orCalls } = createTrackedSupabase();

		const result = await searchKnowledge(supabase, TEST_ORG_ID, "nonexistent", {
			audience: "internal",
		});

		expect(result).toEqual([]);
		expect(orCalls).toHaveLength(2); // content ILIKE + visibility filter
	});
});
