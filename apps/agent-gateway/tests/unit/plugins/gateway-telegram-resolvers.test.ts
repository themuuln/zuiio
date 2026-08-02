import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { resolveOrgFromBotKey } from "../../../../../packages/gateway-telegram/src/index";

vi.mock("server-only", () => ({}));

const TEST_ORG_ID = "org-test-123";

function singleResult<T>(data: T | null) {
	if (!data)
		return Promise.resolve({
			data: null,
			error: { code: "PGRST116" },
		} as const);
	return Promise.resolve({ data, error: null } as const);
}

function maybeSingleResult<T>(data: T | null) {
	return Promise.resolve({ data, error: data ? null : null } as const);
}

/**
 * Creates a mock Supabase client for resolveOrgFromBotKey testing.
 *
 * resolveOrgFromBotKey makes two queries:
 * 1. supabase.from("custom_bots").select(...).eq("id", botKey).eq("is_active", true).single()
 * 2. supabase.from("channel_connections").select("audience").eq("bot_key", botKey).eq("is_active", true).maybeSingle()
 *
 * We use a table-name dispatch so each query returns the correct data.
 */
function createMockSupabase(
	customBotData: Record<string, unknown> | null,
	channelConnData: Record<string, unknown> | null,
) {
	const customBotChain = {
		select: vi.fn(() => customBotChain),
		eq: vi.fn(() => customBotChain),
		single: vi.fn(() => singleResult(customBotData)),
	};
	const channelConnChain = {
		select: vi.fn(() => channelConnChain),
		eq: vi.fn(() => channelConnChain),
		maybeSingle: vi.fn(() => maybeSingleResult(channelConnData)),
	};

	return {
		from: vi.fn((table: string) => {
			if (table === "custom_bots") return customBotChain;
			if (table === "channel_connections") return channelConnChain;
			throw new Error(`Unexpected table: ${table}`);
		}),
	} as unknown as SupabaseClient;
}

// ─── resolveOrgFromBotKey ───────────────────────────────────────────────────

describe("resolveOrgFromBotKey — Mode B", () => {
	it("resolves org from a valid bot key with default customer audience", async () => {
		const supabase = createMockSupabase(
			{ organization_id: TEST_ORG_ID, product_type: "tolom" },
			null, // no channel_connection → default customer
		);

		const result = await resolveOrgFromBotKey(supabase, "valid-bot-key");

		expect(result).not.toBeNull();
		expect(result?.orgId).toBe(TEST_ORG_ID);
		expect(result?.productType).toBe("tolom");
		expect(result?.audience).toBe("customer");
		expect(result?.channel).toBe("telegram");
	});

	it("resolves audience from channel_connections when present", async () => {
		const supabase = createMockSupabase(
			{ organization_id: TEST_ORG_ID, product_type: "zer" },
			{ audience: "internal" },
		);

		const result = await resolveOrgFromBotKey(supabase, "valid-bot-key");

		expect(result).not.toBeNull();
		expect(result?.audience).toBe("internal");
	});

	it("returns null for invalid bot key", async () => {
		const supabase = createMockSupabase(null, null);

		const result = await resolveOrgFromBotKey(supabase, "invalid-key");

		expect(result).toBeNull();
	});

	it("returns null when custom_bots query fails", async () => {
		const supabase = createMockSupabase(null, null);

		const result = await resolveOrgFromBotKey(supabase, "inactive-key");

		expect(result).toBeNull();
	});
});
