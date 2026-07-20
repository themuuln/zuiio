import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveOrgFromChatUser } from "@zuiio/gateway-telegram";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const TEST_CHAT_ID = 111222333;
const TEST_USER_ID = 444555666;
const TEST_ORG_ID = "org-test-123";

function createMockSupabase(data: unknown) {
	const chain = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		order: vi.fn(() => chain),
		limit: vi.fn(() => chain),
		single: vi.fn(() =>
			data
				? Promise.resolve({ data, error: null })
				: Promise.resolve({ data: null, error: { code: "PGRST116" } }),
		),
	};
	return { from: vi.fn(() => chain), ...chain } as unknown as SupabaseClient;
}

function makeTelegramLinkRecord(overrides: Record<string, unknown> = {}) {
	return {
		id: "conn-001",
		organization_id: TEST_ORG_ID,
		user_id: "user-abc",
		product_type: "zer",
		telegram_chat_id: TEST_CHAT_ID,
		telegram_user_id: TEST_USER_ID,
		telegram_username: "test_user",
		first_name: "Test",
		last_name: "User",
		is_active: true,
		created_at: "2025-01-01T00:00:00Z",
		updated_at: "2025-06-01T00:00:00Z",
		last_active_at: "2025-06-15T12:00:00Z",
		...overrides,
	};
}

describe("resolveOrgFromChatUser — audience", () => {
	it("always returns audience = internal for SSO-linked Telegram", async () => {
		const record = makeTelegramLinkRecord();
		const supabase = createMockSupabase(record);

		const result = await resolveOrgFromChatUser(
			supabase,
			TEST_CHAT_ID,
			TEST_USER_ID,
		);

		expect(result.context.audience).toBe("internal");
	});

	it("throws error when no link exists", async () => {
		const supabase = createMockSupabase(null);

		await expect(
			resolveOrgFromChatUser(supabase, TEST_CHAT_ID, TEST_USER_ID),
		).rejects.toThrow(
			"Таны Telegram холбогдоогүй байна. /start командыг ашиглана уу.",
		);
	});

	it("returns active connection with all required fields", async () => {
		const record = makeTelegramLinkRecord();
		const supabase = createMockSupabase(record);

		const result = await resolveOrgFromChatUser(
			supabase,
			TEST_CHAT_ID,
			TEST_USER_ID,
		);

		expect(result.context).toMatchObject({
			orgId: TEST_ORG_ID,
			userId: "user-abc",
			productType: "zer",
			audience: "internal",
			channel: "telegram",
			channelChatId: String(TEST_CHAT_ID),
			channelUserId: String(TEST_USER_ID),
		});
		expect(result.connection).toBeDefined();
		expect(result.connection.organization_id).toBe(TEST_ORG_ID);
	});
});
