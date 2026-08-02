import { describe, expect, it, vi } from "vitest";
import {
	computeSortedDurations,
	computeToolAverages,
	getUsageStats,
	percentile,
} from "@/state/usage";

vi.mock("server-only", () => ({}));

const ORG = "org-1";

/** Table-aware Supabase mock for getUsageStats aggregation tests. */
function makeSupabase(tables: Record<string, unknown[]>) {
	const from = vi.fn((table: string) => {
		let headMode = false;
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn(
			(_cols?: string, options?: Record<string, unknown>) => {
				headMode = Boolean(options?.head);
				return chain;
			},
		);
		chain.eq = vi.fn(() => chain);
		chain.gte = vi.fn(() => chain);
		chain.lte = vi.fn(() => chain);
		chain.order = vi.fn(() =>
			Promise.resolve({ data: tables[table] ?? [], error: null }),
		);
		chain.single = vi.fn(() =>
			Promise.resolve({ data: (tables[table] ?? [])[0] ?? null, error: null }),
		);
		// Awaited chains (queries that end without .order/.single):
		// head queries return {count}, full queries return {data}.
		chain.then = (resolve: (v: unknown) => unknown) =>
			resolve(
				headMode
					? { count: (tables[table] ?? []).length, data: null, error: null }
					: { data: tables[table] ?? [], error: null },
			);
		return chain;
	});
	return { from } as never;
}

describe("getUsageStats — per-channel + error aggregation", () => {
	it("aggregates byChannel and errorRate from audit rows", async () => {
		const sb = makeSupabase({
			agent_daily_spend: [
				{ date: "2026-08-01", tokens_used: 1000, api_calls: 10 },
			],
			agent_audit_log: [
				{
					tool_name: "readData",
					duration_ms: 100,
					channel: "telegram",
					error: null,
				},
				{
					tool_name: "readData",
					duration_ms: 200,
					channel: "telegram",
					error: null,
				},
				{
					tool_name: "writeData",
					duration_ms: 50,
					channel: "facebook",
					error: "boom",
				},
				{ tool_name: "readData", duration_ms: 300, channel: null, error: null },
			],
			agent_handoff_events: [{ status: "human_resolved" }],
		});

		const stats = await getUsageStats(sb, ORG, 7);

		expect(stats.totalToolCalls).toBe(4);
		expect(stats.byChannel).toEqual([
			{ channel: "telegram", toolCalls: 2, errors: 0 },
			{ channel: "facebook", toolCalls: 1, errors: 1 },
			{ channel: "unknown", toolCalls: 1, errors: 0 },
		]);
		expect(stats.errorRate).toBe(0.25);
		// [50,100,200,300] → floor(4*0.5)=2 → sorted[2]=200
		expect(stats.responseTimeMs.p50).toBe(200);
	});

	it("computes response time percentiles over durations", () => {
		const durations = computeSortedDurations([
			{ duration_ms: 300, tool_name: "a" },
			{ duration_ms: null, tool_name: "a" },
			{ duration_ms: 100, tool_name: "a" },
			{ duration_ms: 200, tool_name: "a" },
		]);
		expect(durations).toEqual([100, 200, 300]);
		// floor(3*0.5)=1 → sorted[1]=200
		expect(percentile(durations, 0.5)).toBe(200);
		expect(percentile([], 0.5)).toBe(0);
	});

	it("counts conversations from sessions", async () => {
		const sb = makeSupabase({
			agent_daily_spend: [],
			agent_audit_log: [],
			agent_handoff_events: [],
			agent_sessions: [{ id: "s1" }, { id: "s2" }],
		});
		const stats = await getUsageStats(sb, ORG, 7);
		expect(stats.conversationCount).toBe(2);
	});

	it("computes tool averages sorted by slowest", () => {
		const averages = computeToolAverages([
			{ duration_ms: 100, tool_name: "fast" },
			{ duration_ms: 900, tool_name: "slow" },
			{ duration_ms: 500, tool_name: "mid" },
		]);
		expect(averages.map((a) => a.name)).toEqual(["slow", "mid", "fast"]);
	});
});
