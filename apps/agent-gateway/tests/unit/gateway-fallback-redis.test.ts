/**
 * AiGateway fallback/rate-limit behavior + Redis-backed checkRateLimit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@zuiio/capture", () => ({
	capture: vi.fn(),
}));

describe("AiGateway", () => {
	const CONTEXT = { orgId: "org-1", userId: "u", supabase: {} as never };

	it("returns the primary result on success", async () => {
		const { AiGateway } = await import("@/providers/types");
		const primary = { runWithTools: vi.fn(async () => "answer") };
		const fallback = { runWithTools: vi.fn(async () => "fallback") };
		const gateway = new AiGateway(primary, fallback);
		const result = await gateway.runWithTools({
			system: "s",
			userMessage: "m",
			tools: [],
			context: CONTEXT,
		});
		expect(result).toBe("answer");
		expect(fallback.runWithTools).not.toHaveBeenCalled();
	});

	it("returns a Mongolian message on 429 rate-limit errors", async () => {
		const { AiGateway } = await import("@/providers/types");
		const primary = {
			runWithTools: vi.fn(async () => {
				throw new Error("HTTP 429 Too Many Requests");
			}),
		};
		const fallback = { runWithTools: vi.fn(async () => "fallback") };
		const gateway = new AiGateway(primary, fallback);
		const result = await gateway.runWithTools({
			system: "s",
			userMessage: "m",
			tools: [],
			context: CONTEXT,
		});
		expect(result).toContain("хязгаарт хүрсэн");
		expect(fallback.runWithTools).not.toHaveBeenCalled();
	});

	it("matches quota wording in error messages", async () => {
		const { AiGateway } = await import("@/providers/types");
		const primary = {
			runWithTools: vi.fn(async () => {
				throw new Error("usage limit reached");
			}),
		};
		const gateway = new AiGateway(primary);
		const result = await gateway.runWithTools({
			system: "s",
			userMessage: "m",
			tools: [],
			context: CONTEXT,
		});
		expect(result).toContain("хязгаарт хүрсэн");
	});

	it("delegates to the fallback provider on other errors", async () => {
		const { AiGateway } = await import("@/providers/types");
		const primary = {
			runWithTools: vi.fn(async () => {
				throw new Error("connection reset");
			}),
		};
		const fallback = { runWithTools: vi.fn(async () => "fallback answer") };
		const gateway = new AiGateway(primary, fallback);
		const result = await gateway.runWithTools({
			system: "s",
			userMessage: "m",
			tools: [],
			context: CONTEXT,
		});
		expect(result).toBe("fallback answer");
		expect(fallback.runWithTools).toHaveBeenCalledTimes(1);
	});

	it("rethrows when there is no fallback", async () => {
		const { AiGateway } = await import("@/providers/types");
		const primary = {
			runWithTools: vi.fn(async () => {
				throw new Error("boom");
			}),
		};
		const gateway = new AiGateway(primary);
		await expect(
			gateway.runWithTools({
				system: "s",
				userMessage: "m",
				tools: [],
				context: CONTEXT,
			}),
		).rejects.toThrow("boom");
	});
});

describe("checkRateLimit (Redis path)", () => {
	const mockExec = vi.fn();
	const mockZremrangebyscore = vi.fn();
	const mockZcard = vi.fn();
	const mockZadd = vi.fn();
	const mockExpire = vi.fn();
	const mockZrem = vi.fn();
	const mockZrange = vi.fn();
	let mockGetRedis: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockExec.mockResolvedValue([null, 0, 1, 1]);
		mockZrange.mockResolvedValue(["1000", "5000"]);
		mockGetRedis = vi.fn(() => ({
			pipeline: () => ({
				zremrangebyscore: mockZremrangebyscore,
				zcard: mockZcard,
				zadd: mockZadd,
				expire: mockExpire,
				exec: mockExec,
			}),
			zrem: mockZrem,
			zrange: mockZrange,
		}));
		vi.doMock("@/lib/redis", () => ({
			getRedis: (...a: unknown[]) => mockGetRedis(...a),
		}));
	});
	afterEach(() => {
		vi.doUnmock("@/lib/redis");
	});

	it("allows requests under the limit via redis", async () => {
		const { checkRateLimit } = await import("@/state/rate-limit");
		const result = await checkRateLimit(`redis-ok-${Date.now()}`, 20);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(19);
		expect(result.resetInMs).toBe(60_000);
		expect(mockZremrangebyscore).toHaveBeenCalled();
		expect(mockExpire).toHaveBeenCalled();
	});

	it("blocks requests over the limit and removes the extra entry", async () => {
		mockExec.mockResolvedValue([null, 20, 1, 1]); // 20 existing entries
		mockZrange.mockResolvedValue([
			"member-1",
			String(Date.now() - 1_000), // oldest entry 1s ago
		]);
		const { checkRateLimit } = await import("@/state/rate-limit");
		const result = await checkRateLimit(`redis-block-${Date.now()}`, 20);
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
		expect(mockZrem).toHaveBeenCalledTimes(1);
		// ~59s left in the 60s window
		expect(result.resetInMs).toBeGreaterThan(55_000);
	});

	it("falls back to the in-memory limiter when redis is unavailable", async () => {
		mockGetRedis.mockReturnValue(null);
		const { checkRateLimit } = await import("@/state/rate-limit");
		const key = `redis-fallback-${Date.now()}`;
		const r1 = await checkRateLimit(key, 2);
		expect(r1.allowed).toBe(true);
		const r2 = await checkRateLimit(key, 2);
		expect(r2.allowed).toBe(true);
		const r3 = await checkRateLimit(key, 2);
		expect(r3.allowed).toBe(false);
	});

	it("falls back to the in-memory limiter when redis throws", async () => {
		mockExec.mockRejectedValue(new Error("redis down"));
		const { checkRateLimit } = await import("@/state/rate-limit");
		const key = `redis-throw-${Date.now()}`;
		const r1 = await checkRateLimit(key, 1);
		expect(r1.allowed).toBe(true);
		const r2 = await checkRateLimit(key, 1);
		expect(r2.allowed).toBe(false);
	});
});
