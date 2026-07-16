import { describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_ORG_ID } from "../fixtures/supabase-mock";

describe("checkDailyBudget", () => {
	it("allows request when under the limit", async () => {
		const { checkDailyBudget } = await import("@/state/budget");
		const mockSupabase = createMockSupabase({
			data: { tokens_used: 100 },
			error: null,
		});

		const result = await checkDailyBudget(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			TEST_ORG_ID,
		);

		expect(result.allowed).toBe(true);
		expect(result.tokensUsedToday).toBe(100);
	});

	it("allows request when no spend record exists (PGRST116 error)", async () => {
		const { checkDailyBudget } = await import("@/state/budget");
		const mockSupabase = createMockSupabase({
			data: null,
			error: { code: "PGRST116", message: "No rows returned" },
		});

		const result = await checkDailyBudget(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			TEST_ORG_ID,
		);

		expect(result.allowed).toBe(true);
		expect(result.tokensUsedToday).toBe(0);
	});

	it("blocks request when over the hard cap", async () => {
		const { checkDailyBudget } = await import("@/state/budget");
		const mockSupabase = createMockSupabase({
		data: { tokens_used: 10_000_001 },
			error: null,
		});

		const result = await checkDailyBudget(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			TEST_ORG_ID,
		);

		expect(result.allowed).toBe(false);
		expect(result.reason).toBeDefined();
	});
});

describe("recordUsageAtomic", () => {
	it("calls increment_daily_spend RPC", async () => {
		const { recordUsageAtomic } = await import("@/state/budget");
		const mockSupabase = createMockSupabase({ data: null, error: null });

		await recordUsageAtomic(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			TEST_ORG_ID,
			500,
		);

		expect(mockSupabase.rpc).toHaveBeenCalledWith("increment_daily_spend", {
			p_org_id: TEST_ORG_ID,
			p_date: expect.any(String),
			p_tokens: 500,
		});
	});
});

describe("loadSession", () => {
	it("returns empty state when no session exists", async () => {
		const { loadSession } = await import("@/state/session");
		const mockSupabase = createMockSupabase({
			data: null,
			error: { code: "PGRST116", message: "No rows returned" },
		});

		const result = await loadSession(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			TEST_ORG_ID,
			12345,
			67890,
		);

		expect(result.messages).toEqual([]);
		expect(result.tokenCount).toBe(0);
	});

	it("returns existing session data", async () => {
		const { loadSession } = await import("@/state/session");
		const mockSupabase = createMockSupabase({
			data: {
				messages: [
					{ role: "user", content: "Hello" },
					{ role: "assistant", content: "Hi there" },
				],
				token_count: 150,
			},
			error: null,
		});

		const result = await loadSession(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			TEST_ORG_ID,
			12345,
			67890,
		);

		expect(result.messages).toHaveLength(2);
		expect(result.tokenCount).toBe(150);
	});
});
