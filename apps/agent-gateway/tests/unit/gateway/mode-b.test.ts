import { describe, expect, it, vi } from "vitest";
import { TEST_ORG_ID } from "../../fixtures/supabase-mock";

describe("resolveOrgFromBotKey", () => {
	it("resolves org from a valid bot key", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: {
					organization_id: TEST_ORG_ID,
					product_type: "tolom",
				},
				error: null,
			}),
		};

		const { resolveOrgFromBotKey } = await import("@/gateway/mode-b");

		const result = await resolveOrgFromBotKey(
			mockSupabase as never,
			"valid-bot-key-123",
		);

		expect(result).not.toBeNull();
		expect(result?.orgId).toBe(TEST_ORG_ID);
		expect(result?.productType).toBe("tolom");
		expect(result?.channel).toBe("telegram");

		expect(mockSupabase.from).toHaveBeenCalledWith("custom_bots");
		expect(mockSupabase.eq).toHaveBeenCalledWith("id", "valid-bot-key-123");
		expect(mockSupabase.eq).toHaveBeenCalledWith("is_active", true);
	});

	it("returns null for inactive bot key", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: null,
				error: { code: "PGRST116", message: "No rows" },
			}),
		};

		const { resolveOrgFromBotKey } = await import("@/gateway/mode-b");

		const result = await resolveOrgFromBotKey(
			mockSupabase as never,
			"nonexistent-key",
		);

		expect(result).toBeNull();
	});

	it("returns null for nonexistent bot key", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: null,
				error: { code: "PGRST116", message: "No rows" },
			}),
		};

		const { resolveOrgFromBotKey } = await import("@/gateway/mode-b");

		const result = await resolveOrgFromBotKey(
			mockSupabase as never,
			"no-such-key",
		);

		expect(result).toBeNull();
	});

	it("uses organization_id as userId when user_id is not available", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: {
					organization_id: TEST_ORG_ID,
					product_type: "zer",
				},
				error: null,
			}),
		};

		const { resolveOrgFromBotKey } = await import("@/gateway/mode-b");

		const result = await resolveOrgFromBotKey(
			mockSupabase as never,
			"bot-key-xyz",
		);

		expect(result?.userId).toBe(TEST_ORG_ID);
	});
});
