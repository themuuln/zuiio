/**
 * Unified error reporting for React error boundaries.
 *
 * Every error.tsx / global-error.tsx should call this instead of console.error()
 * so that errors are both logged locally AND sent to Sentry.
 */
import * as Sentry from "@sentry/nextjs";

export function reportError(error: unknown, boundary?: string) {
  const err = error instanceof Error ? error : new Error(String(error));

  // Local visibility (devtools / server logs)
  console.error(boundary ? `[${boundary}]` : "Error:", err);

  // Sentry
  Sentry.captureException(err, {
    tags: { source: "error-boundary" },
    ...(boundary && { extra: { boundary } }),
  });
}
