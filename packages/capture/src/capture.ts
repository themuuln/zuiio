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

type CaptureHandler = (error: unknown, ctx?: CaptureContext) => void;

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
 */
export function capture(error: unknown, ctx?: CaptureContext): void {
  const label = ctx?.context ?? "Unlabeled";

  // Always console.error so the dev terminal shows it immediately
  console.error(`[capture] ${label}`, error, ctx ?? "");

  // Send to the registered telemetry handler (Sentry, etc.)
  handler?.(error, ctx);
}

/**
 * Capture a Supabase query error — adds structured context tags.
 */
export function captureDbError(
  cause: string,
  queryLabel: string,
  error: unknown,
  ctx?: CaptureContext,
): void {
  capture(error, {
    ...ctx,
    context: `[db] ${queryLabel}`,
    db_cause: cause,
  });
}

/**
 * Capture a redirect-loop detection.
 */
export function captureRedirectLoop(
  path: string,
  count: number,
  userId?: string,
): void {
  capture(new Error(`Redirect loop detected: ${path} (×${count})`), {
    context: "[redirect-loop]",
    path,
    redirectCount: count,
    userId,
  });
}
