import { afterEach, describe, expect, it, vi } from "vitest";

describe("runAgentWithFallback", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("calls onResult with agent response on fast path", async () => {
		vi.useFakeTimers();
		const { runAgentWithFallback } = await import("@/state/async-job");

		const onResult = vi.fn();
		const onAsyncFallback = vi.fn();
		const onError = vi.fn();

		runAgentWithFallback(Promise.resolve("quick response"), {
			onResult,
			onAsyncFallback,
			onError,
		});

		// Fast path: agent resolves before timeout
		await vi.runAllTimersAsync();

		expect(onResult).toHaveBeenCalledWith("quick response");
		expect(onAsyncFallback).not.toHaveBeenCalled();
		expect(onError).not.toHaveBeenCalled();
	});

	it("calls onAsyncFallback then onResult when agent exceeds timeout", async () => {
		vi.useFakeTimers();
		const { runAgentWithFallback } = await import("@/state/async-job");

		const onResult = vi.fn();
		const onAsyncFallback = vi.fn();
		const onError = vi.fn();

		// Agent that takes longer than default 8s timeout
		let resolveAgent: (v: string) => void;
		const slowAgent = new Promise<string>((resolve) => {
			resolveAgent = resolve;
		});

		runAgentWithFallback(slowAgent, {
			onResult,
			onAsyncFallback,
			onError,
		});

		// Fast-forward past timeout
		await vi.advanceTimersByTimeAsync(8001);

		expect(onAsyncFallback).toHaveBeenCalled();

		// Now resolve the slow agent
		resolveAgent?.("slow result");
		await vi.runAllTimersAsync();

		expect(onResult).toHaveBeenCalledWith("slow result");
		expect(onError).not.toHaveBeenCalled();
	});

	it("calls onError with rate limit message for 429 errors", async () => {
		vi.useFakeTimers();
		const { runAgentWithFallback } = await import("@/state/async-job");

		const onResult = vi.fn();
		const onAsyncFallback = vi.fn();
		const onError = vi.fn();

		runAgentWithFallback(
			Promise.reject(new Error("API 429 Too Many Requests")),
			{
				onResult,
				onAsyncFallback,
				onError,
				timeoutMs: 100,
			},
		);

		await vi.runAllTimersAsync();

		expect(onError).toHaveBeenCalled();
		const errorMsg = onError.mock.calls[0][0] as string;
		expect(errorMsg).toContain("хязгаарт");
		expect(errorMsg).toContain("⚠️");
	});

	it("calls onError with generic message for non-rate-limit errors", async () => {
		vi.useFakeTimers();
		const { runAgentWithFallback } = await import("@/state/async-job");

		const onResult = vi.fn();
		const onAsyncFallback = vi.fn();
		const onError = vi.fn();

		runAgentWithFallback(Promise.reject(new Error("Internal server error")), {
			onResult,
			onAsyncFallback,
			onError,
			timeoutMs: 100,
		});

		await vi.runAllTimersAsync();

		expect(onError).toHaveBeenCalled();
		const errorMsg = onError.mock.calls[0][0] as string;
		expect(errorMsg).toContain("Уучлаарай");
	});

	it("uses custom timeoutMs when provided", async () => {
		vi.useFakeTimers();
		const { runAgentWithFallback } = await import("@/state/async-job");

		const onResult = vi.fn();
		const onAsyncFallback = vi.fn();
		const onError = vi.fn();

		let resolveAgent: (v: string) => void;
		const slowAgent = new Promise<string>((resolve) => {
			resolveAgent = resolve;
		});

		runAgentWithFallback(slowAgent, {
			onResult,
			onAsyncFallback,
			onError,
			timeoutMs: 2000,
		});

		// Should NOT trigger at 1500ms
		await vi.advanceTimersByTimeAsync(1500);
		expect(onAsyncFallback).not.toHaveBeenCalled();

		// Should trigger at 2000ms
		await vi.advanceTimersByTimeAsync(501);
		expect(onAsyncFallback).toHaveBeenCalled();

		resolveAgent?.("done");
		await vi.runAllTimersAsync();
		expect(onResult).toHaveBeenCalledWith("done");
	});

	it("handles rate limit detection with 'rate limit' phrase", async () => {
		vi.useFakeTimers();
		const { runAgentWithFallback } = await import("@/state/async-job");

		const onError = vi.fn();

		runAgentWithFallback(Promise.reject(new Error("rate limit exceeded")), {
			onResult: vi.fn(),
			onAsyncFallback: vi.fn(),
			onError,
			timeoutMs: 100,
		});

		await vi.runAllTimersAsync();

		const errorMsg = onError.mock.calls[0][0] as string;
		expect(errorMsg).toContain("хязгаарт");
	});
});
