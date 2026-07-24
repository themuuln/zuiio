import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Redis only — key-rotation reads process.env directly for env fallback
vi.mock("@/lib/redis", () => ({
	getRedis: vi.fn(),
}));

describe("key rotation module", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getCurrentKey", () => {
		it("returns env var key when OPENCODE_API_KEY is set and Redis is unavailable", async () => {
			process.env.OPENCODE_API_KEY = "env-single-key";
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(null);

			const { getCurrentKey } = await import("@/lib/key-rotation");
			const key = await getCurrentKey();

			expect(key).toBe("env-single-key");
		});

		it("parses comma-separated env var keys", async () => {
			process.env.OPENCODE_API_KEY = "key-1,key-2,key-3";
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(null);

			const { getCurrentKey } = await import("@/lib/key-rotation");
			const key = await getCurrentKey();

			expect(key).toBe("key-1");
		});

		it("rotates to next key on subsequent call after markKeyFailed", async () => {
			process.env.OPENCODE_API_KEY = "key-a,key-b,key-c";

			const { getCurrentKey, markKeyFailed } = await import(
				"@/lib/key-rotation"
			);

			const first = await getCurrentKey();
			expect(first).toBe("key-a");

			markKeyFailed();

			const second = await getCurrentKey();
			expect(second).toBe("key-b");
		});

		it("wraps around to first key after exhausting all keys", async () => {
			process.env.OPENCODE_API_KEY = "key-x,key-y";

			const { getCurrentKey, markKeyFailed } = await import(
				"@/lib/key-rotation"
			);

			expect(await getCurrentKey()).toBe("key-x");
			markKeyFailed();
			expect(await getCurrentKey()).toBe("key-y");
			markKeyFailed();
			// Wraps around
			expect(await getCurrentKey()).toBe("key-x");
		});
	});

	describe("getKeyStatus", () => {
		it("returns key status with count and rotation info", async () => {
			process.env.OPENCODE_API_KEY = "k1,k2,k3";

			const { getKeyStatus } = await import("@/lib/key-rotation");
			const status = await getKeyStatus();

			expect(status.total).toBe(3);
			expect(status.current).toBeGreaterThanOrEqual(0);
		});
	});

	describe("markKeyFailed", () => {
		it("does nothing when there's only one key", async () => {
			process.env.OPENCODE_API_KEY = "only-key";

			const { getCurrentKey, markKeyFailed } = await import(
				"@/lib/key-rotation"
			);

			expect(await getCurrentKey()).toBe("only-key");
			markKeyFailed();
			// Still returns the same key
			expect(await getCurrentKey()).toBe("only-key");
		});
	});
});
