/**
 * link-code redeemLinkCode coverage: expiry deletion, link swap, upsert
 * failure. createLinkCode covered in tests/integration/link-code.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const _mockCreateServiceClient = vi.fn();

function chainableSupabase(
	handlers: Record<string, () => unknown | Promise<unknown>>,
) {
	const from = vi.fn((table: string) => {
		const chain: Record<string, unknown> = {};
		for (const m of [
			"select",
			"eq",
			"is",
			"single",
			"update",
			"delete",
			"upsert",
		]) {
			chain[m] = vi.fn().mockReturnValue(chain);
		}
		const handler = handlers[table];
		if (handler) {
			(chain as unknown as { then: unknown }).then = (
				resolve: (v: unknown) => unknown,
			) => Promise.resolve().then(handler).then(resolve);
		}
		return chain;
	});
	return { from };
}

const FUTURE = new Date(Date.now() + 60_000).toISOString();
const PAST = new Date(Date.now() - 60_000).toISOString();

function tokenRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "tok-1",
		organization_id: "org-link-1",
		user_id: "user-1",
		product_type: "zer",
		expires_at: FUTURE,
		...overrides,
	};
}

describe("redeemLinkCode", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("returns null when the code is not found", async () => {
		const sb = chainableSupabase({
			one_time_tokens: () => ({ data: null, error: { message: "not found" } }),
		});
		const { redeemLinkCode } = await import("@/lib/link-code");
		const result = await redeemLinkCode(sb as never, "ABCD-1234", {
			telegramChatId: 111,
			telegramUserId: 222,
		});
		expect(result).toBeNull();
	});

	it("returns null when the token row is missing", async () => {
		const sb = chainableSupabase({
			one_time_tokens: () => ({ data: null, error: null }),
		});
		const { redeemLinkCode } = await import("@/lib/link-code");
		const result = await redeemLinkCode(sb as never, "ABCD-1234", {
			telegramChatId: 111,
			telegramUserId: 222,
		});
		expect(result).toBeNull();
	});

	it("deletes expired tokens and returns null", async () => {
		const sb = chainableSupabase({
			one_time_tokens: () => ({
				data: tokenRow({ expires_at: PAST }),
				error: null,
			}),
		});
		const { redeemLinkCode } = await import("@/lib/link-code");
		const result = await redeemLinkCode(sb as never, "ABCD-1234", {
			telegramChatId: 111,
			telegramUserId: 222,
		});
		expect(result).toBeNull();
		// expired token row was deleted
		const deleteCalls = sb.from.mock.results
			.map((r: { value: { delete: unknown } }) => r.value.delete)
			.filter(
				(m: unknown) => (m as ReturnType<typeof vi.fn>).mock.calls.length > 0,
			);
		expect(deleteCalls).toHaveLength(1);
	});

	it("swaps the old link and returns org/user identity on success", async () => {
		const sb = chainableSupabase({
			one_time_tokens: () => ({ data: tokenRow(), error: null }),
			telegram_links: () => ({ data: null, error: null }),
		});
		const { redeemLinkCode } = await import("@/lib/link-code");
		const result = await redeemLinkCode(
			sb as never,
			"abcd-1234", // lowercase + hyphen normalized
			{ telegramChatId: 111, telegramUserId: 222, telegramUsername: "@b" },
		);
		expect(result).toEqual({
			orgId: "org-link-1",
			userId: "user-1",
			productType: "zer",
		});

		// old active link deactivated first (second update marks the token used)
		const updateCalls = sb.from.mock.results
			.map((r: { value: { update: unknown } }) => r.value.update)
			.filter(
				(m: unknown) => (m as ReturnType<typeof vi.fn>).mock.calls.length > 0,
			);
		expect(updateCalls).toHaveLength(2);
		const updateArgs = (updateCalls[0] as ReturnType<typeof vi.fn>).mock
			.calls[0] as unknown[];
		expect(updateArgs[0]).toMatchObject({ is_active: false });

		// new link upserted with channel identity
		const upsertCalls = sb.from.mock.results
			.map((r: { value: { upsert: unknown } }) => r.value.upsert)
			.filter(
				(m: unknown) => (m as ReturnType<typeof vi.fn>).mock.calls.length > 0,
			);
		expect(upsertCalls).toHaveLength(1);
		const upsertArgs = (upsertCalls[0] as ReturnType<typeof vi.fn>).mock
			.calls[0] as unknown[];
		expect(upsertArgs[0]).toMatchObject({
			organization_id: "org-link-1",
			user_id: "user-1",
			telegram_chat_id: 111,
			telegram_user_id: 222,
			telegram_username: "@b",
			product_type: "zer",
			is_active: true,
		});
	});

	it("returns null when the link upsert fails", async () => {
		const sb = chainableSupabase({
			one_time_tokens: () => ({ data: tokenRow(), error: null }),
			telegram_links: () => ({ error: new Error("constraint") }),
		});
		const { redeemLinkCode } = await import("@/lib/link-code");
		const result = await redeemLinkCode(sb as never, "ABCD-1234", {
			telegramChatId: 111,
			telegramUserId: 222,
		});
		expect(result).toBeNull();
	});
});
