import "server-only";
import { capture } from "@zuiio/capture";

/**
 * Async job fallback for long-running LLM queries.
 *
 * Telegram webhooks must return within ~8s. If the agent takes longer, we
 * acknowledge the user immediately and hand the message to the durable
 * agent_async_jobs queue (processed by the process-jobs cron), instead of
 * relying on an in-process continuation that dies with the request.
 *
 * The agent promise is kept as a best-effort first attempt: when it resolves
 * within the timeout the result is delivered inline and no job is enqueued.
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
	/**
	 * Durable fallback: enqueues the message into agent_async_jobs so the
	 * process-jobs cron can run it later. When set, it replaces the
	 * in-process continuation on timeout. Returns the enqueued job id, or
	 * null when enqueueing failed.
	 */
	enqueueDurable?: () => Promise<{ id: string } | null>;
}

/**
 * Run an agent query with an async fallback.
 *
 * If the agent finishes within `timeoutMs`, the result is delivered inline.
 * Otherwise `onAsyncFallback` is called and the message is enqueued durably
 * (via `enqueueDurable`) so the cron can process it after the request ends.
 * If no durable queue is configured — or enqueueing fails — the agent
 * promise continues in-process as a best-effort fallback.
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
				// Prefer the durable queue: the request ends right after this
				// handler returns, so an in-process promise is not reliable.
				const enqueued = opts.enqueueDurable
					? await opts.enqueueDurable()
					: null;

				await opts.onAsyncFallback();

				if (!enqueued) {
					// Best-effort: no durable queue configured or enqueueing
					// failed — keep the in-process continuation so the reply
					// is still delivered.
					const finalResult = await agentPromise;
					console.log(
						`[async-job] background result ready, len=${finalResult.length}, took ${Date.now() - start}ms`,
					);
					await opts.onResult(finalResult);
				} else {
					console.log(
						`[async-job] enqueued durable job ${enqueued.id}, took ${Date.now() - start}ms`,
					);
				}
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
			const message = isRateLimit
				? "⚠️ Үйлчилгээний хэрэглээ хязгаарт хүрсэн байна. Түр хүлээгээд дахин оролдоно уу."
				: "Уучлаарай, хүсэлтийг боловсруулахад алдаа гарлаа. Дахин оролдоно уу.";

			// Retry durably — transient failures (rate limits, provider
			// outages) often succeed on a later cron run.
			if (opts.enqueueDurable) {
				try {
					const enqueued = await opts.enqueueDurable();
					if (enqueued) {
						console.log(
							`[async-job] enqueued durable job ${enqueued.id} after failure`,
						);
					}
				} catch (enqueueErr) {
					capture(enqueueErr, {
						context: "agent-gateway: enqueue after failure",
					});
				}
			}

			await opts.onError(message);
		}
	})();
}
