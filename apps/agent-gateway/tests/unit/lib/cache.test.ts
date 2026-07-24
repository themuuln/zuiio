import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Redis
vi.mock("@/lib/redis", () => ({
	getRedis: vi.fn(),
}));

describe("cache module", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	describe("getCachedSession", () => {
		it("returns null when Redis is unavailable", async () => {
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(null);

			const { getCachedSession } = await import("@/lib/cache");

			const result = await getCachedSession(
				"org-1",
				"telegram",
				"chat-1",
				"user-1",
			);

			expect(result).toBeNull();
		});

		it("returns null when cache miss", async () => {
			const mockRedis = {
				get: vi.fn().mockResolvedValue(null),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { getCachedSession } = await import("@/lib/cache");

			const result = await getCachedSession(
				"org-1",
				"telegram",
				"chat-1",
				"user-1",
			);

			expect(result).toBeNull();
		});

		it("returns parsed session data from Redis", async () => {
			const sessionData = { messages: [] as string[], tokensUsed: 100 };
			const mockRedis = {
				get: vi.fn().mockResolvedValue(sessionData),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { getCachedSession } = await import("@/lib/cache");

			const result = await getCachedSession<typeof sessionData>(
				"org-1",
				"telegram",
				"chat-1",
				"user-1",
			);

			expect(result).toEqual(sessionData);
		});
	});

	describe("setCachedSession", () => {
		it("sets session data in Redis with TTL", async () => {
			const mockRedis = {
				set: vi.fn().mockResolvedValue("OK"),
				get: vi.fn(),
				del: vi.fn(),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { setCachedSession } = await import("@/lib/cache");

			await setCachedSession("org-1", "telegram", "chat-1", "user-1", {
				messages: [],
			});

			expect(mockRedis.set).toHaveBeenCalled();
			const setCall = mockRedis.set.mock.calls[0];
			expect(setCall[0]).toContain("session:");
			expect(setCall[0]).toContain("org-1");
			expect(setCall[0]).toContain("telegram");
			expect(setCall[2]).toEqual({ ex: 86400 }); // 24h ex TTL via Upstash API
		});

		it("does not throw when Redis is unavailable", async () => {
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(null);

			const { setCachedSession } = await import("@/lib/cache");

			await expect(
				setCachedSession("org-1", "telegram", "chat-1", "user-1", {}),
			).resolves.not.toThrow();
		});
	});

	describe("getCachedBudget", () => {
		it("returns null when Redis is unavailable", async () => {
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(null);

			const { getCachedBudget } = await import("@/lib/cache");

			const result = await getCachedBudget("org-1");
			expect(result).toBeNull();
		});

		it("returns parsed budget data", async () => {
			const mockRedis = {
				get: vi.fn().mockResolvedValue({ tokensUsed: 5000 }),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { getCachedBudget } = await import("@/lib/cache");

			const result = await getCachedBudget("org-1");
			expect(result).toEqual({ tokensUsed: 5000 });
		});
	});

	describe("setCachedBudget", () => {
		it("sets budget data in Redis with 5-minute TTL", async () => {
			const mockRedis = {
				set: vi.fn().mockResolvedValue("OK"),
				get: vi.fn(),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { setCachedBudget } = await import("@/lib/cache");

			await setCachedBudget("org-1", 10000);

			expect(mockRedis.set).toHaveBeenCalled();
			const call = mockRedis.set.mock.calls[0];
			expect(call[0]).toContain("budget:");
			expect(call[2]).toEqual({ ex: 300 }); // 5 min
		});
	});

	describe("getCachedWizard", () => {
		it("returns null when Redis is unavailable", async () => {
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(null);

			const { getCachedWizard } = await import("@/lib/cache");

			const result = await getCachedWizard(
				"org-1",
				"chat-1",
				"user-1",
				"telegram",
			);
			expect(result).toBeNull();
		});

		it("returns parsed wizard data", async () => {
			const mockRedis = {
				get: vi.fn().mockResolvedValue({ step: 1, data: { field: "value" } }),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { getCachedWizard } = await import("@/lib/cache");

			const result = await getCachedWizard(
				"org-1",
				"chat-1",
				"user-1",
				"telegram",
			);
			expect(result).toEqual({ step: 1, data: { field: "value" } });
		});
	});

	describe("setCachedWizard", () => {
		it("sets wizard data with 30-minute TTL", async () => {
			const mockRedis = {
				set: vi.fn().mockResolvedValue("OK"),
				get: vi.fn(),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { setCachedWizard } = await import("@/lib/cache");

			await setCachedWizard("org-1", "chat-1", "user-1", "telegram", {
				step: 2,
			});

			expect(mockRedis.set).toHaveBeenCalled();
			const call = mockRedis.set.mock.calls[0];
			expect(call[2]).toEqual({ ex: 1800 }); // 30 min
		});
	});

	describe("invalidateCachedSession", () => {
		it("deletes session key from Redis", async () => {
			const mockRedis = {
				del: vi.fn().mockResolvedValue(1),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { invalidateCachedSession } = await import("@/lib/cache");

			await invalidateCachedSession("org-1", "telegram", "chat-1", "user-1");

			expect(mockRedis.del).toHaveBeenCalled();
		});

		it("does not throw when Redis is unavailable", async () => {
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(null);

			const { invalidateCachedSession } = await import("@/lib/cache");

			await expect(
				invalidateCachedSession("org-1", "telegram", "chat-1", "user-1"),
			).resolves.not.toThrow();
		});
	});

	describe("invalidateCachedWizard", () => {
		it("deletes wizard key from Redis", async () => {
			const mockRedis = {
				del: vi.fn().mockResolvedValue(1),
			};
			const { getRedis } = await import("@/lib/redis");
			vi.mocked(getRedis).mockReturnValue(mockRedis as never);

			const { invalidateCachedWizard } = await import("@/lib/cache");

			await invalidateCachedWizard("org-1", "chat-1", "user-1", "telegram");

			expect(mockRedis.del).toHaveBeenCalled();
		});
	});
});
