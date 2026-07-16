import { describe, expect, it, vi } from "vitest";
import { createMockSupabase } from "../fixtures/supabase-mock";
import { TEST_ORG_ID, TEST_USER_ID } from "../fixtures/supabase-mock";

// Mock node:crypto before importing modules
vi.mock("node:crypto", () => {
	const actual = require("node:crypto") as typeof import("node:crypto");
	return {
		...actual,
		randomBytes: vi.fn((size: number) => {
			// Deterministic bytes for testing
			const buf = Buffer.alloc(size, 0x42);
			return buf;
		}),
	};
});

describe("createLinkCode", () => {
	it("creates a formatted 8-char code with hyphen", async () => {
		const { createLinkCode } = await import("@/lib/link-code");
		const mockSupabase = createMockSupabase({ data: null, error: null });

		const result = await createLinkCode(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			TEST_ORG_ID,
			TEST_USER_ID,
			"zer",
		);

		expect(result).not.toBeNull();
		expect(result!.code).toHaveLength(8);
		expect(result!.formatted).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
	});

	it("returns null when insert fails", async () => {
		const { createLinkCode } = await import("@/lib/link-code");
		const mockSupabase = createMockSupabase({
			data: null,
			error: new Error("duplicate key"),
		});

		const result = await createLinkCode(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			TEST_ORG_ID,
			TEST_USER_ID,
			"zer",
		);

		expect(result).toBeNull();
	});
});

describe("redeemLinkCode", () => {
	it("returns null for garbage code", async () => {
		const { redeemLinkCode } = await import("@/lib/link-code");
		const mockSupabase = createMockSupabase({ data: null, error: null });

		const result = await redeemLinkCode(
			mockSupabase as unknown as ReturnType<typeof createMockSupabase>,
			"BOGUS!",
			{
				telegramChatId: 123,
				telegramUserId: 456,
			},
		);

		expect(result).toBeNull();
	});
});
