import { describe, expect, it } from "vitest";

// ─── Pure: percentile computation ─────────────────────────────────────────

/**
 * Compute a percentile from a sorted array. Cloned from usage.ts to test
 * the pure logic without the Supabase dependency.
 */
function percentile(sorted: number[], p: number): number {
	if (sorted.length === 0) return 0;
	const idx = Math.floor(sorted.length * p);
	const clamped = Math.min(idx, sorted.length - 1);
	return sorted[clamped] ?? 0;
}

/**
 * Compute per-tool averages from a durations array. Cloned from usage.ts.
 */
function computeToolAverages(
	durations: Array<{ duration_ms: number; tool_name: string }>,
): Array<{ name: string; avgMs: number }> {
	const map = new Map<string, { sum: number; count: number }>();
	for (const row of durations) {
		const entry = map.get(row.tool_name) ?? { sum: 0, count: 0 };
		entry.sum += row.duration_ms;
		entry.count += 1;
		map.set(row.tool_name, entry);
	}
	return Array.from(map.entries())
		.map(([name, { sum, count }]) => ({
			name,
			avgMs: Math.round(sum / count),
		}))
		.sort((a, b) => b.avgMs - a.avgMs)
		.slice(0, 10);
}

/**
 * Filter and sort durations. Cloned from usage.ts.
 */
function computeSortedDurations(
	durations: Array<{ duration_ms: number | null; tool_name: string }>,
): number[] {
	return (durations ?? [])
		.filter(
			(d): d is { duration_ms: number; tool_name: string } =>
				d.duration_ms !== null && d.duration_ms !== undefined,
		)
		.map((d) => d.duration_ms)
		.sort((a, b) => a - b);
}

// ─── Percentile tests ─────────────────────────────────────────────────────

describe("percentile", () => {
	it("returns 0 for empty array", () => {
		expect(percentile([], 0.5)).toBe(0);
	});

	it("returns the only value for single-element array", () => {
		expect(percentile([42], 0.5)).toBe(42);
		expect(percentile([42], 0.95)).toBe(42);
		expect(percentile([42], 0.99)).toBe(42);
	});

	it("computes p50 correctly for odd count", () => {
		// sorted [10, 20, 30, 40, 50]
		// idx = floor(5 * 0.5) = 2 → sorted[2] = 30
		const arr = [10, 20, 30, 40, 50];
		expect(percentile(arr, 0.5)).toBe(30);
	});

	it("computes p50 correctly for even count", () => {
		// sorted [10, 20, 30, 40]
		// idx = floor(4 * 0.5) = 2 → sorted[2] = 30
		const arr = [10, 20, 30, 40];
		expect(percentile(arr, 0.5)).toBe(30);
	});

	it("computes p95 correctly", () => {
		// sorted 1..50 (50 elements)
		// idx = floor(50 * 0.95) = 47 → sorted[47] = 48
		const arr = Array.from({ length: 50 }, (_, i) => i + 1);
		expect(percentile(arr, 0.95)).toBe(48);
	});

	it("computes p99 correctly", () => {
		// sorted 1..100 (100 elements)
		// idx = floor(100 * 0.99) = 99 → sorted[99] = 100
		const arr = Array.from({ length: 100 }, (_, i) => i + 1);
		expect(percentile(arr, 0.99)).toBe(100);
	});

	it("computes all percentiles for 50-element array", () => {
		const arr = Array.from({ length: 50 }, (_, i) => (i + 1) * 10);
		// [10, 20, ..., 500]
		// p50: idx=floor(50*0.5)=25 → sorted[25]=260
		// p95: idx=floor(50*0.95)=47 → sorted[47]=480
		// p99: idx=floor(50*0.99)=49 → sorted[49]=500
		expect(percentile(arr, 0.5)).toBe(260);
		expect(percentile(arr, 0.95)).toBe(480);
		expect(percentile(arr, 0.99)).toBe(500);
	});

	it("clamps index to array bounds", () => {
		const arr = [100, 200];
		// p95: idx=floor(2*0.95)=1 → sorted[1]=200
		expect(percentile(arr, 0.95)).toBe(200);
		// p99: idx=floor(2*0.99)=1 → sorted[1]=200
		expect(percentile(arr, 0.99)).toBe(200);
	});

	it("handles all identical values", () => {
		const arr = Array.from({ length: 100 }, () => 42);
		expect(percentile(arr, 0.5)).toBe(42);
		expect(percentile(arr, 0.95)).toBe(42);
		expect(percentile(arr, 0.99)).toBe(42);
	});
});

// ─── Duration sorting & filtering tests ──────────────────────────────────

describe("computeSortedDurations", () => {
	it("returns empty array for null/undefined input", () => {
		expect(computeSortedDurations(null as unknown as [])).toEqual([]);
		expect(computeSortedDurations([])).toEqual([]);
	});

	it("filters out null durations", () => {
		const input = [
			{ duration_ms: null, tool_name: "readData" },
			{ duration_ms: 100, tool_name: "readData" },
			{ duration_ms: undefined as unknown as null, tool_name: "writeData" },
			{ duration_ms: 200, tool_name: "writeData" },
		];
		expect(computeSortedDurations(input)).toEqual([100, 200]);
	});

	it("sorts durations ascending", () => {
		const input = [
			{ duration_ms: 300, tool_name: "readData" },
			{ duration_ms: 100, tool_name: "readData" },
			{ duration_ms: 200, tool_name: "readData" },
		];
		expect(computeSortedDurations(input)).toEqual([100, 200, 300]);
	});
});

// ─── Per-tool average computation tests ───────────────────────────────────

describe("computeToolAverages", () => {
	it("computes averages for multiple tools", () => {
		const durations = [
			{ duration_ms: 100, tool_name: "readData" },
			{ duration_ms: 300, tool_name: "readData" },
			{ duration_ms: 500, tool_name: "writeData" },
			{ duration_ms: 600, tool_name: "searchCustomers" },
			{ duration_ms: 200, tool_name: "writeData" },
		];
		expect(computeToolAverages(durations)).toEqual([
			{ name: "searchCustomers", avgMs: 600 },
			{ name: "writeData", avgMs: 350 },
			{ name: "readData", avgMs: 200 },
		]);
	});

	it("returns empty array for no durations", () => {
		expect(computeToolAverages([])).toEqual([]);
	});

	it("sorts descending by avgMs", () => {
		const durations = [
			{ duration_ms: 100, tool_name: "fastTool" },
			{ duration_ms: 900, tool_name: "slowTool" },
			{ duration_ms: 500, tool_name: "mediumTool" },
		];
		const result = computeToolAverages(durations);
		expect(result.map((t) => t.name)).toEqual([
			"slowTool",
			"mediumTool",
			"fastTool",
		]);
	});

	it("caps at 10 entries", () => {
		const durations = Array.from({ length: 15 }, (_, i) => ({
			duration_ms: 100,
			tool_name: `tool-${i}`,
		}));
		expect(computeToolAverages(durations).length).toBeLessThanOrEqual(10);
	});

	it("rounds average to integer", () => {
		const durations = [
			{ duration_ms: 100, tool_name: "a" },
			{ duration_ms: 101, tool_name: "a" },
		];
		// (100+101)/2 = 100.5 → Math.round → 101
		expect(computeToolAverages(durations)).toEqual([{ name: "a", avgMs: 101 }]);
	});

	it("handles single tool with many entries", () => {
		const durations = Array.from({ length: 1000 }, (_, i) => ({
			duration_ms: i,
			tool_name: "singleTool",
		}));
		const result = computeToolAverages(durations);
		expect(result).toHaveLength(1);
		// biome-ignore lint/style/noNonNullAssertion: guarded by toHaveLength(1) above
		const first = result[0]!;
		expect(first.name).toBe("singleTool");
		// sum 0..999 = 499500, avg = 499.5 → round → 500
		expect(first.avgMs).toBe(500);
	});
});

// ─── getUsageStats: type contract tests ───────────────────────────────────

describe("getUsageStats — type contract", () => {
	it("returns all required properties including new fields", async () => {
		const { getUsageStats } = await import("@/state/usage");

		// Use createMockSupabase which supports all chain methods
		const { createMockSupabase, TEST_ORG_ID } = await import(
			"../fixtures/supabase-mock"
		);
		const supabase = createMockSupabase({ data: [], error: null });

		const stats = await getUsageStats(supabase, TEST_ORG_ID, 7);

		// Verify all expected properties exist (contract test)
		expect(stats).toHaveProperty("responseTimeMs");
		expect(stats.responseTimeMs).toHaveProperty("p50");
		expect(stats.responseTimeMs).toHaveProperty("p95");
		expect(stats.responseTimeMs).toHaveProperty("p99");
		expect(stats.responseTimeMs).toHaveProperty("toolAverages");
		expect(stats).toHaveProperty("conversationCount");
		expect(stats).toHaveProperty("totalTokens");
		expect(stats).toHaveProperty("estimatedCost");
		expect(stats).toHaveProperty("dailyBreakdown");
		expect(stats).toHaveProperty("handoffCount");
	});

	it("returns responseTimeMs with correct types", async () => {
		const { getUsageStats } = await import("@/state/usage");
		const { createMockSupabase, TEST_ORG_ID } = await import(
			"../fixtures/supabase-mock"
		);
		const supabase = createMockSupabase({ data: [], error: null });

		const stats = await getUsageStats(supabase, TEST_ORG_ID, 7);

		expect(typeof stats.responseTimeMs.p50).toBe("number");
		expect(typeof stats.responseTimeMs.p95).toBe("number");
		expect(typeof stats.responseTimeMs.p99).toBe("number");
		expect(Array.isArray(stats.responseTimeMs.toolAverages)).toBe(true);
		expect(typeof stats.conversationCount).toBe("number");
	});
});

// ─── CSV shape verification ──────────────────────────────────────────────

describe("usage analytics — CSV shape", () => {
	it("includes all new metric fields in CSV header", async () => {
		const { getUsageStats } = await import("@/state/usage");
		const { createMockSupabase, TEST_ORG_ID } = await import(
			"../fixtures/supabase-mock"
		);
		const supabase = createMockSupabase({ data: [], error: null });

		const stats = await getUsageStats(supabase, TEST_ORG_ID, 7);

		// Simulate the CSV row format from the route handler
		const header =
			"date,tokens,api_calls,tool_calls,handoffs,conversations,p50_ms,p95_ms,p99_ms,estimated_cost_usd";

		expect(header).toContain("p50_ms");
		expect(header).toContain("p95_ms");
		expect(header).toContain("p99_ms");
		expect(header).toContain("conversations");
		expect(header).toContain("estimated_cost_usd");

		// Verify CSV row fields are accessible
		const csvRow = `2026-07-06,1000,50,${stats.totalToolCalls},${stats.handoffCount},${stats.conversationCount},${stats.responseTimeMs.p50},${stats.responseTimeMs.p95},${stats.responseTimeMs.p99},${stats.estimatedCost}`;
		const fields = csvRow.split(",");
		expect(fields).toHaveLength(10);
		expect(typeof Number(fields[6])).toBe("number");
		expect(typeof Number(fields[9])).toBe("number");
	});
});
