import { resolveOrgFromBotKey } from "@zuiio/gateway-telegram";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const BOT_KEY = "bot-key-001";
const ORG_ID = "org-test-123";

function createMockSupabase(
	customBotsResult: unknown,
	channelConnResult: unknown,
) {
	const chain = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		single: vi.fn(() => customBotsResult as never),
		maybeSingle: vi.fn(() => channelConnResult as never),
		limit: vi.fn(() => chain),
		order: vi.fn(() => chain),
	};
	const from = vi.fn((table: string) => {
		if (table === "custom_bots")
			chain.single = vi.fn(() => customBotsResult as never);
		if (table === "channel_connections")
			chain.maybeSingle = vi.fn(() => channelConnResult as never);
		return chain;
	});
	return { from, ...chain } as never;
}

describe("resolveOrgFromBotKey — audience resolution", () => {
	it("returns audience from channel_connections when present", async () => {
		const supabase = createMockSupabase(
			{ data: { organization_id: ORG_ID, product_type: "zer" }, error: null },
			{ data: { audience: "internal" }, error: null },
		);

		const result = await resolveOrgFromBotKey(supabase, BOT_KEY);

		expect(result).not.toBeNull();
		expect(result?.audience).toBe("internal");
		expect(result?.orgId).toBe(ORG_ID);
		expect(result?.productType).toBe("zer");
	});

	it("defaults to customer when channel_connections has no row", async () => {
		const supabase = createMockSupabase(
			{ data: { organization_id: ORG_ID, product_type: "tolom" }, error: null },
			{ data: null, error: null },
		);

		const result = await resolveOrgFromBotKey(supabase, BOT_KEY);

		expect(result).not.toBeNull();
		expect(result?.audience).toBe("customer");
	});

	it("defaults to customer when channel_connections audience is null", async () => {
		const supabase = createMockSupabase(
			{ data: { organization_id: ORG_ID, product_type: "zer" }, error: null },
			{ data: { audience: null }, error: null },
		);

		const result = await resolveOrgFromBotKey(supabase, BOT_KEY);

		expect(result).not.toBeNull();
		expect(result?.audience).toBe("customer");
	});

	it("returns null when custom_bot not found", async () => {
		const supabase = createMockSupabase(
			{ data: null, error: { message: "not found", code: "PGRST116" } },
			{ data: null, error: null },
		);

		const result = await resolveOrgFromBotKey(supabase, BOT_KEY);

		expect(result).toBeNull();
	});
});
