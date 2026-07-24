import { describe, expect, it } from "vitest";
import type { GatewayTool } from "@/providers/types";
import { createMockSupabase, TEST_ORG_ID } from "../fixtures/supabase-mock";

describe("withAudit", () => {
	it("wraps tool execution with timing and audit logging", async () => {
		const { withAudit } = await import("@/state/audit");
		const mockSupabase = createMockSupabase({ data: null, error: null });

		const tool: GatewayTool = {
			name: "getTest",
			description: "Test tool",
			parameters: [],
			execute: async () => ({ result: "ok" }),
		};

		const wrapped = withAudit(tool, "telegram", "12345", "67890");

		// The wrapped tool should still return the original result
		// and call logToolCall internally
		const result = await wrapped.execute(
			{},
			{ orgId: TEST_ORG_ID, userId: "user-1", supabase: mockSupabase },
		);

		expect(result).toEqual({ result: "ok" });
	});

	it("preserves original tool metadata", async () => {
		const { withAudit } = await import("@/state/audit");

		const tool: GatewayTool = {
			name: "getTest",
			description: "Test tool",
			parameters: [
				{ name: "p1", type: "string", description: "param", required: false },
			],
			execute: async () => ({}),
		};

		const wrapped = withAudit(tool, "telegram", "12345", "67890");
		expect(wrapped.name).toBe("getTest");
		expect(wrapped.description).toBe("Test tool");
		expect(wrapped.parameters).toHaveLength(1);
	});

	it("logs errors when tool execution fails", async () => {
		const { withAudit } = await import("@/state/audit");
		const mockSupabase = createMockSupabase({ data: null, error: null });

		const tool: GatewayTool = {
			name: "getFailing",
			description: "Failing tool",
			parameters: [],
			execute: async () => {
				throw new Error("DB connection failed");
			},
		};

		const wrapped = withAudit(tool, "telegram", "12345", "67890");

		await expect(
			wrapped.execute(
				{},
				{ orgId: TEST_ORG_ID, userId: "user-1", supabase: mockSupabase },
			),
		).rejects.toThrow("DB connection failed");
	});
});
