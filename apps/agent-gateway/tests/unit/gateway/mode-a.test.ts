import { describe, expect, it, vi } from "vitest";
import {
	TEST_CHAT_ID,
	TEST_ORG_ID,
	TEST_TELEGRAM_USER_ID,
	TEST_USER_ID,
} from "../../fixtures/supabase-mock";

describe("resolveOrgFromChatUser", () => {
	const mockLinkRecord = {
		id: "link-1",
		organization_id: TEST_ORG_ID,
		user_id: TEST_USER_ID,
		telegram_chat_id: TEST_CHAT_ID,
		telegram_user_id: TEST_TELEGRAM_USER_ID,
		product_type: "zer",
		is_active: true,
		last_active_at: new Date().toISOString(),
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	it("resolves org from active telegram link", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: mockLinkRecord,
				error: null,
			}),
		};

		const { resolveOrgFromChatUser } = await import("@/gateway/mode-a");

		const result = await resolveOrgFromChatUser(
			mockSupabase as never,
			TEST_CHAT_ID,
			TEST_TELEGRAM_USER_ID,
		);

		expect(result.context.orgId).toBe(TEST_ORG_ID);
		expect(result.context.userId).toBe(TEST_USER_ID);
		expect(result.context.productType).toBe("zer");
		expect(result.context.channel).toBe("telegram");
		expect(result.context.channelChatId).toBe(String(TEST_CHAT_ID));
		expect(result.context.channelUserId).toBe(String(TEST_TELEGRAM_USER_ID));

		// Verify query chain
		expect(mockSupabase.from).toHaveBeenCalledWith("telegram_links");
		expect(mockSupabase.eq).toHaveBeenCalledWith("is_active", true);
	});

	it("throws Mongolian error when no active link found", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: null,
				error: { code: "PGRST116", message: "No rows" },
			}),
		};

		const { resolveOrgFromChatUser } = await import("@/gateway/mode-a");

		await expect(
			resolveOrgFromChatUser(
				mockSupabase as never,
				TEST_CHAT_ID,
				TEST_TELEGRAM_USER_ID,
			),
		).rejects.toThrow("холбогдоогүй");
	});

	it("queries with correct chat and user ids", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: mockLinkRecord,
				error: null,
			}),
		};

		const { resolveOrgFromChatUser } = await import("@/gateway/mode-a");

		await resolveOrgFromChatUser(mockSupabase as never, 555555, 666666);

		// Should query by the correct telegram ids
		const eqCalls = mockSupabase.eq.mock.calls;
		expect(eqCalls).toContainEqual(["telegram_chat_id", 555555]);
		expect(eqCalls).toContainEqual(["telegram_user_id", 666666]);
	});

	it("orders by last_active_at descending for most recent connection", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: mockLinkRecord,
				error: null,
			}),
		};

		const { resolveOrgFromChatUser } = await import("@/gateway/mode-a");

		await resolveOrgFromChatUser(
			mockSupabase as never,
			TEST_CHAT_ID,
			TEST_TELEGRAM_USER_ID,
		);

		expect(mockSupabase.order).toHaveBeenCalledWith("last_active_at", {
			ascending: false,
		});
		expect(mockSupabase.limit).toHaveBeenCalledWith(1);
	});
});
