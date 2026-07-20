import "server-only";
import { capture } from "@zuiio/capture";

/**
 * Simple async job fallback for long-running LLM queries.
 *
 * Telegram webhooks have a ~60s timeout. If the agent takes >8s,
 * we acknowledge the user immediately and send the result later.
 *
 * Production should use a proper queue (BullMQ, Inngest, etc.).
 */

/** Delay helper for use with Promise.race */
function delay(ms: number): Promise<"timeout"> {
	return new Promise((resolve) => setTimeout(() => resolve("timeout"), ms));
}

export interface AsyncFallbackOptions {
	/** Milliseconds before falling back to async mode (default 8000). */
	timeoutMs?: number;
	/** Callback to notify the user that processing has started. */
	onAsyncFallback: () => Promise<void>;
	/** Callback to deliver the final result. */
	onResult: (text: string) => Promise<void>;
	/** Callback to deliver an error message. */
	onError: (message: string) => Promise<void>;
}

/**
 * Run an agent query with an async fallback.
 *
 * If the agent takes longer than `timeoutMs`, calls `onAsyncFallback`
 * immediately, then continues processing in the background.
 * The final result is delivered via `onResult`.
 *
 * Returns immediately — the caller should not wait for the result.
 */
export function runAgentWithFallback(
	agentPromise: Promise<string>,
	opts: AsyncFallbackOptions,
): void {
	const timeoutMs = opts.timeoutMs ?? 8000;

	// Fire and forget — the webhook responds, but processing continues
	void (async () => {
		const start = Date.now();
		try {
			const result = await Promise.race([agentPromise, delay(timeoutMs)]);

			if (result === "timeout") {
				console.log(
					`[async-job] timeout after ${timeoutMs}ms, falling back to background`,
				);
				await opts.onAsyncFallback();
				const finalResult = await agentPromise;
				console.log(
					`[async-job] background result ready, len=${finalResult.length}, took ${Date.now() - start}ms`,
				);
				await opts.onResult(finalResult);
			} else {
				console.log(
					`[async-job] fast path, len=${(result as string).length}, took ${Date.now() - start}ms`,
				);
				await opts.onResult(result as string);
			}
		} catch (err) {
			console.error(`[async-job] error after ${Date.now() - start}ms:`, err);
			capture(err, { context: "agent-gateway: async agent" });
			const isRateLimit =
				err instanceof Error &&
				(/\b429\b/.test(err.message) ||
					/rate.?limit|usage.?limit|quota/i.test(err.message));
			await opts.onError(
				isRateLimit
					? "⚠️ Үйлчилгээний хэрэглээ хязгаарт хүрсэн байна. Түр хүлээгээд дахин оролдоно уу."
					: "Уучлаарай, хүсэлтийг боловсруулахад алдаа гарлаа. Дахин оролдоно уу.",
			);
		}
	})();
}
