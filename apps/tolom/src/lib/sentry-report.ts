/**
 * Unified error reporting for React error boundaries.
 *
 * Every error.tsx / global-error.tsx should call this instead of console.error()
 * so that errors are both logged locally AND sent to Sentry.
 *
 * Routes through @zuiio/capture which dispatches to the registered telemetry
 * handler (Sentry) and always logs to console.error.
 */
import { capture } from "@zuiio/capture";

export function reportError(error: unknown, boundary?: string) {
  capture(error, {
    context: boundary ? `[error-boundary] ${boundary}` : "error-boundary",
  });
}
