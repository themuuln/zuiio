import "server-only";

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
  try {
   const result = await Promise.race([agentPromise, delay(timeoutMs)]);

   if (result === "timeout") {
    // Notify user, then keep waiting
    await opts.onAsyncFallback();
    const finalResult = await agentPromise;
    await opts.onResult(finalResult);
   } else {
    // Fast path — result arrived before timeout
    await opts.onResult(result as string);
   }
  } catch (err) {
   console.error("Async agent error:", err);
   await opts.onError(
    "Уучлаарай, хүсэлтийг боловсруулахад алдаа гарлаа. Дахин оролдоно уу.",
   );
  }
 })();
}
