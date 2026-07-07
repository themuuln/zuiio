/**
 * Unified error capture — the single place errors get reported.
 *
 * Designed to be framework-agnostic: apps plug in their own telemetry
 * transport (Sentry, Datadog, etc.) via `setCaptureHandler()`. When no
 * handler is set, errors still surface via `console.error()`.
 *
 * Usage (in an app):
 *   import { setCaptureHandler } from "@zuiio/capture";
 *   import * as Sentry from "@sentry/nextjs";
 *   setCaptureHandler((error, ctx) => { Sentry.captureException(error, { extra: ctx }); });
 *
 * Usage (anywhere in codebase):
 *   import { capture, captureDbError } from "@zuiio/capture";
 *   capture(error, { context: "Dashboard profile query" });
 *   captureDbError("missing_column", "getProfile", error);
 */

// ── Types ───────────────────────────────────────────────────────

export type CaptureContext = Record<string, unknown> & {
  /** Short human label — appears in every log line. */
  context?: string;
};

type CaptureHandler = (
  error: unknown,
  ctx?: CaptureContext,
) => Promise<void> | void;

// ── State ───────────────────────────────────────────────────────

let handler: CaptureHandler | null = null;

// ── Public API ───────────────────────────────────────────────────

/**
 * Set the telemetry handler (e.g. Sentry.captureException).
 * Call once during app initialization (e.g. in sentry.client.config.ts).
 */
export function setCaptureHandler(fn: CaptureHandler | null): void {
  handler = fn;
}

/**
 * Capture an exception/error — sends to the registered telemetry handler
 * and always logs to console.error with structured context.
 *
 * **Important**: This function is async. For full flush guarantee (e.g. in
 * serverless), callers should `await` the result. Without `await`, the
 * handler fires but may not complete before process exit — acceptable for
 * fire-and-forget telemetry but not for guaranteed delivery.
 */
export async function capture(
  error: unknown,
  ctx?: CaptureContext,
): Promise<void> {
  const label = ctx?.context ?? "Unlabeled";

  // Always console.error so the dev terminal shows it immediately
  console.error(`[capture] ${label}`, error, ctx ?? "");

  // Send to the registered telemetry handler (Sentry, etc.)
  // Wrapped in try/catch to prevent handler failures from crashing the app
  // (Node 22+ crashes on unhandled promise rejections by default).
  try {
    await handler?.(error, ctx);
  } catch (e) {
    console.error("[capture] handler failed", e);
  }
}

/**
 * Capture a Supabase query error — adds structured context tags.
 */
export async function captureDbError(
  cause: string,
  queryLabel: string,
  error: unknown,
  ctx?: CaptureContext,
): Promise<void> {
  await capture(error, {
    ...ctx,
    context: `[db] ${queryLabel}`,
    db_cause: cause,
  });
}

/**
 * Capture a redirect-loop detection.
 */
export async function captureRedirectLoop(
  path: string,
  count: number,
  userId?: string,
): Promise<void> {
  await capture(new Error(`Redirect loop detected: ${path} (×${count})`), {
    context: "[redirect-loop]",
    path,
    redirectCount: count,
    userId,
  });
}
