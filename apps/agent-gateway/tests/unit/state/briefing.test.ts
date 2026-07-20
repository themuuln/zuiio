import { describe, expect, it, vi } from "vitest";

/**
 * Chainable Supabase mock that resolves to the given value when awaited.
 * All chain methods return `this` so the chain is built up,
 * then the chain's `.then` resolves to the provided resolveValue.
 */
function makeChain(resolveValue: unknown) {
	const chain: Record<string, unknown> = {};
	const methods = [
		"from",
		"select",
		"eq",
		"neq",
		"gt",
		"gte",
		"lt",
		"lte",
		"in",
		"is",
		"not",
		"order",
		"limit",
		"range",
		"single",
	];
	for (const m of methods) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	(chain as unknown as { then: unknown }).then = vi.fn(
		async (resolve: (v: unknown) => unknown) => resolve(resolveValue),
	);
	return chain;
}

describe("gatherBriefingData", () => {
	it("returns briefing data with zero counts when no activity", async () => {
		const emptyRows = { data: [], error: null };
		const sb = makeChain(emptyRows);

		// Override single to return org data for the first .single() call
		const orgResult = { data: { name: "Test Org" }, error: null };
		sb.single = vi.fn().mockResolvedValue(orgResult);

		const { gatherBriefingData } = await import("@/state/briefing");

		const result = await gatherBriefingData(sb as never, "org-1", 12345);

		expect(result).not.toBeNull();
		expect(result?.orgName).toBe("Test Org");
		expect(result?.overnightToolCalls).toBe(0);
		expect(result?.overnightMessages).toBe(0);
		expect(result?.pendingHandoffs).toBe(0);
		expect(result?.anomalies).toHaveLength(0);
	});

	it("returns null on error and does not throw", async () => {
		const sb = {
			from: vi.fn().mockImplementation(() => {
				throw new Error("DB connection error");
			}),
		};

		const { gatherBriefingData } = await import("@/state/briefing");

		const result = await gatherBriefingData(sb as never, "org-1", 12345);

		expect(result).toBeNull();
	});

	it("uses orgId as fallback name when org not found", async () => {
		const emptyRows = { data: [], error: null };
		const sb = makeChain(emptyRows);

		// First .single() fails — org not found
		sb.single = vi.fn().mockResolvedValue({
			data: null,
			error: { code: "PGRST116" },
		});

		const { gatherBriefingData } = await import("@/state/briefing");

		const result = await gatherBriefingData(
			sb as never,
			"fallback-org-id",
			12345,
		);

		expect(result).not.toBeNull();
		expect(result?.orgName).toBe("fallback-org-id");
	});
});

describe("logBriefing", () => {
	it("inserts briefing log record", async () => {
		const sb = {
			from: vi.fn().mockReturnThis(),
			insert: vi.fn().mockResolvedValue({ error: null }),
		};

		const { logBriefing } = await import("@/state/briefing");

		await logBriefing(
			sb as never,
			{
				orgId: "org-1",
				orgName: "Test Org",
				overnightMessages: 5,
				overnightToolCalls: 10,
				pendingHandoffs: 1,
				topQueries: [],
				anomalies: [],
				date: "2026-01-01",
			},
			"Briefing text here",
			12345,
		);

		expect(sb.from).toHaveBeenCalledWith("agent_briefing_log");
		expect(sb.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				organization_id: "org-1",
				admin_chat_id: 12345,
				overnight_messages: 5,
				overnight_tool_calls: 10,
			}),
		);
	});

	it("does not throw on insert error", async () => {
		const sb = {
			from: vi.fn().mockReturnThis(),
			insert: vi.fn().mockRejectedValue(new Error("Insert failed")),
		};

		const { logBriefing } = await import("@/state/briefing");

		await expect(
			logBriefing(
				sb as never,
				{
					orgId: "org-1",
					orgName: "Test",
					overnightMessages: 0,
					overnightToolCalls: 0,
					pendingHandoffs: 0,
					topQueries: [],
					anomalies: [],
					date: "2026-01-01",
				},
				"",
				0,
			),
		).resolves.not.toThrow();
	});
});
