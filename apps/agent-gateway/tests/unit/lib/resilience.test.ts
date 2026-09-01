import { afterEach, describe, expect, it, vi } from "vitest";
import {
	calculateBackoff,
	classifyError,
	withResilientFetch,
	withResilientOperation,
	withSafeRetry,
} from "@/lib/resilience";

describe("resilience: classifyError", () => {
	it("classifies 429 and 402 as non-retryable quota errors", () => {
		const r429 = classifyError(429);
		expect(r429.retryable).toBe(false);
		expect(r429.isQuotaOrAuth).toBe(true);

		const r402 = classifyError(402);
		expect(r402.retryable).toBe(false);
		expect(r402.isQuotaOrAuth).toBe(true);
	});

	it("classifies 401 and 403 as non-retryable auth errors", () => {
		const r401 = classifyError(401);
		expect(r401.retryable).toBe(false);
		expect(r401.isQuotaOrAuth).toBe(true);

		const r403 = classifyError(403);
		expect(r403.retryable).toBe(false);
		expect(r403.isQuotaOrAuth).toBe(true);
	});

	it("classifies quota & billing error messages as non-retryable even without status code", () => {
		expect(
			classifyError(undefined, "Monthly usage limit reached").retryable,
		).toBe(false);
		expect(
			classifyError(undefined, "Monthly usage limit reached").isQuotaOrAuth,
		).toBe(true);

		expect(
			classifyError(undefined, "Region opt-in required for this model")
				.retryable,
		).toBe(false);
		expect(
			classifyError(undefined, "Region opt-in required for this model")
				.isQuotaOrAuth,
		).toBe(true);

		expect(classifyError(undefined, "insufficient_quota error").retryable).toBe(
			false,
		);
		expect(
			classifyError(undefined, "insufficient_quota error").isQuotaOrAuth,
		).toBe(true);

		expect(
			classifyError(undefined, "Rate limit exceeded for organization")
				.retryable,
		).toBe(false);
		expect(
			classifyError(undefined, "Rate limit exceeded for organization")
				.isQuotaOrAuth,
		).toBe(true);
	});

	it("classifies 5xx server errors as retryable", () => {
		for (const status of [500, 502, 503, 504]) {
			const res = classifyError(status);
			expect(res.retryable).toBe(true);
			expect(res.isQuotaOrAuth).toBe(false);
		}
	});

	it("classifies client errors (400, 404, 422) as non-retryable client errors", () => {
		for (const status of [400, 404, 422]) {
			const res = classifyError(status);
			expect(res.retryable).toBe(false);
			expect(res.isQuotaOrAuth).toBe(false);
		}
	});

	it("classifies network connection drops as retryable", () => {
		expect(classifyError(undefined, "fetch failed: ECONNRESET").retryable).toBe(
			true,
		);
		expect(
			classifyError(undefined, "request to host ETIMEDOUT").retryable,
		).toBe(true);
		expect(classifyError(undefined, "UND_ERR_CONNECT_TIMEOUT").retryable).toBe(
			true,
		);
	});
});

describe("resilience: calculateBackoff", () => {
	it("returns a positive integer bounded by maxDelayMs", () => {
		for (let i = 0; i < 50; i++) {
			const delay = calculateBackoff(2, 500, 2000);
			expect(delay).toBeGreaterThanOrEqual(0);
			expect(delay).toBeLessThanOrEqual(2000);
		}
	});
});

describe("resilience: withSafeRetry", () => {
	it("returns result on successful first attempt", async () => {
		const op = vi.fn().mockResolvedValue("success");
		const res = await withSafeRetry(op);
		expect(res).toBe("success");
		expect(op).toHaveBeenCalledTimes(1);
	});

	it("retries on transient failure and succeeds", async () => {
		let attempts = 0;
		const op = vi.fn().mockImplementation(async () => {
			attempts++;
			if (attempts === 1) {
				throw new Error("fetch failed: ECONNRESET");
			}
			return "recovered";
		});

		const onRetry = vi.fn();
		const res = await withSafeRetry(op, { baseDelayMs: 1, onRetry });
		expect(res).toBe("recovered");
		expect(op).toHaveBeenCalledTimes(2);
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it("fast-fails immediately on quota / 429 / usage limit without retrying", async () => {
		const op = vi
			.fn()
			.mockRejectedValue(new Error("Rate limit exceeded (quota error)"));
		const onRetry = vi.fn();

		await expect(
			withSafeRetry(op, { maxRetries: 3, baseDelayMs: 1, onRetry }),
		).rejects.toThrow("Rate limit exceeded (quota error)");

		expect(op).toHaveBeenCalledTimes(1);
		expect(onRetry).not.toHaveBeenCalled();
	});

	it("fast-fails immediately on region opt-in error without retrying", async () => {
		const op = vi.fn().mockRejectedValue(new Error("Region opt-in required"));
		const onRetry = vi.fn();

		await expect(
			withSafeRetry(op, { maxRetries: 3, baseDelayMs: 1, onRetry }),
		).rejects.toThrow("Region opt-in required");

		expect(op).toHaveBeenCalledTimes(1);
		expect(onRetry).not.toHaveBeenCalled();
	});

	it("throws after exhausting maxRetries on persistent transient error", async () => {
		const op = vi.fn().mockRejectedValue(new Error("fetch failed: ECONNRESET"));
		const onRetry = vi.fn();

		await expect(
			withSafeRetry(op, { maxRetries: 2, baseDelayMs: 1, onRetry }),
		).rejects.toThrow("fetch failed: ECONNRESET");

		expect(op).toHaveBeenCalledTimes(3);
		expect(onRetry).toHaveBeenCalledTimes(2);
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("resilience: withResilientFetch", () => {
	it("retries transient HTTP failures and returns the successful response", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response("temporary", { status: 503 }))
			.mockResolvedValueOnce(new Response("ok", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		const response = await withResilientFetch(
			"https://example.test/resource",
			undefined,
			{
				key: "unit-fetch-retry",
				maxRetries: 1,
				baseDelayMs: 1,
				maxDelayMs: 1,
				timeoutMs: 1000,
				concurrency: 1,
				queueCapacity: 1,
			},
		);

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("returns the final transient response when non-OK throws are disabled", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response("still unavailable", { status: 503 }));
		vi.stubGlobal("fetch", fetchMock);

		const result = await withResilientFetch(
			"https://example.test/unavailable",
			undefined,
			{
				key: "unit-fetch-final-status",
				throwOnNonOk: false,
				maxRetries: 1,
				baseDelayMs: 1,
				maxDelayMs: 1,
				timeoutMs: 1000,
			},
		);

		expect(result.status).toBe(503);
		expect(await result.text()).toBe("still unavailable");
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
	it("does not retry non-idempotent POST requests by default", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response("temporary", { status: 503 }));
		vi.stubGlobal("fetch", fetchMock);

		const result = await withResilientFetch(
			"https://example.test/write",
			{
				method: "POST",
			},
			{
				key: "unit-fetch-write",
				throwOnNonOk: false,
				maxRetries: 2,
				baseDelayMs: 1,
				maxDelayMs: 1,
				timeoutMs: 1000,
			},
		);

		expect(result.status).toBe(503);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("keeps non-retryable responses available when requested", async () => {
		const response = new Response("not found", { status: 404 });
		const fetchMock = vi.fn().mockResolvedValue(response);
		vi.stubGlobal("fetch", fetchMock);

		const result = await withResilientFetch(
			"https://example.test/missing",
			undefined,
			{
				key: "unit-fetch-status",
				throwOnNonOk: false,
				maxRetries: 2,
				baseDelayMs: 1,
				timeoutMs: 1000,
			},
		);

		expect(result).toBe(response);
		expect(result.status).toBe(404);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("throws a typed error for quota responses without retrying", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response("insufficient_quota", {
				status: 429,
				headers: { "Content-Type": "text/plain" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			withResilientFetch("https://example.test/quota", undefined, {
				key: "unit-fetch-quota",
				maxRetries: 3,
				baseDelayMs: 1,
				timeoutMs: 1000,
			}),
		).rejects.toMatchObject({
			name: "ResilientHttpError",
			status: 429,
			body: "insufficient_quota",
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

describe("resilience: external policy composition", () => {
	it("limits concurrent external operations with a shared bulkhead", async () => {
		let active = 0;
		let maxActive = 0;
		const gate = Promise.withResolvers<void>();
		const started = Promise.withResolvers<void>();
		const operations = Array.from({ length: 4 }, (_, index) =>
			withResilientOperation(
				async () => {
					active++;
					maxActive = Math.max(maxActive, active);
					if (active === 2) started.resolve();
					await gate.promise;
					active--;
					return index;
				},
				{
					key: "unit-bulkhead",
					concurrency: 2,
					queueCapacity: 2,
					maxRetries: 0,
					timeoutMs: 1000,
				},
			),
		);

		await started.promise;
		expect(maxActive).toBe(2);
		gate.resolve();
		await expect(Promise.all(operations)).resolves.toHaveLength(4);
	});

	it("opens the circuit after repeated transient failures", async () => {
		let executions = 0;
		const options = {
			key: "unit-circuit",
			maxRetries: 0,
			circuitBreakerThreshold: 2,
			timeoutMs: 1000,
		};
		const failingOperation = () =>
			withResilientOperation(async () => {
				executions++;
				throw new Error("fetch failed: ECONNRESET");
			}, options);

		await expect(failingOperation()).rejects.toThrow("ECONNRESET");
		await expect(failingOperation()).rejects.toThrow("ECONNRESET");
		await expect(failingOperation()).rejects.toThrow();
		expect(executions).toBe(2);
	});

	it("cancels an operation that exceeds the policy timeout", async () => {
		vi.useFakeTimers();
		const pending = withResilientOperation(
			() => new Promise((resolve) => setTimeout(resolve, 25)),
			{
				key: "unit-timeout",
				maxRetries: 0,
				timeoutMs: 5,
			},
		);

		const assertion = expect(pending).rejects.toThrow();
		await vi.advanceTimersByTimeAsync(5);
		await assertion;
	});
});
