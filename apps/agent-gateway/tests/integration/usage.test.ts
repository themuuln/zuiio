import { describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_ORG_ID } from "../fixtures/supabase-mock";

describe("getUsageStats", () => {
	it("returns zeroed stats when no data exists", async () => {
		const { getUsageStats } = await import("@/state/usage");
		const mockSupabase = createMockSupabase({ data: [], error: null });

		const stats = await getUsageStats(mockSupabase, TEST_ORG_ID, 7);
		expect(stats.totalTokens).toBe(0);
		expect(stats.totalApiCalls).toBe(0);
		expect(stats.totalToolCalls).toBe(0);
		expect(stats.handoffCount).toBe(0);
		expect(stats.estimatedCost).toBe(0);
		expect(stats.dailyBreakdown).toHaveLength(0);
	});

	it("calculates tokens and cost correctly", async () => {
		const { getUsageStats } = await import("@/state/usage");

		// Mock that returns spend data but empty tools/handoffs
		const _callCount = 0;
		const mockSupabase = {
			from: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						gte: vi.fn().mockReturnValue({
							lte: vi.fn().mockReturnValue({
								order: vi.fn().mockReturnValue({
									then: (resolve: (v: unknown) => unknown) =>
										resolve({
											data: [
												{
													date: "2026-07-06",
													tokens_used: 50000,
													api_calls: 10,
												},
												{
													date: "2026-07-05",
													tokens_used: 30000,
													api_calls: 5,
												},
											],
											error: null,
										}),
								}),
							}),
						}),
					}),
				}),
			}),
		};

		const stats = await getUsageStats(mockSupabase, TEST_ORG_ID, 7, 0.14);
		expect(stats.totalTokens).toBe(80000);
		expect(stats.totalApiCalls).toBe(15);
		expect(stats.estimatedCost).toBe(0.0112); // 80000 / 1M * 0.14
	});

	it("respects provider cost parameter", async () => {
		const { getUsageStats } = await import("@/state/usage");

		const mockSupabase = {
			from: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						gte: vi.fn().mockReturnValue({
							lte: vi.fn().mockReturnValue({
								order: vi.fn().mockReturnValue({
									then: (resolve: (v: unknown) => unknown) =>
										resolve({
											data: [
												{
													date: "2026-07-06",
													tokens_used: 1000000,
													api_calls: 10,
												},
											],
											error: null,
										}),
								}),
							}),
						}),
					}),
				}),
			}),
		};

		const cheap = await getUsageStats(mockSupabase, TEST_ORG_ID, 7, 0.14);
		expect(cheap.estimatedCost).toBe(0.14); // 1M tokens * $0.14/M

		const expensive = await getUsageStats(mockSupabase, TEST_ORG_ID, 7, 2.0);
		expect(expensive.estimatedCost).toBe(2.0); // 1M tokens * $2.00/M (MBA pricing)
	});
});
