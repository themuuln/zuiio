/**
 * Server-side error reporting utility.
 *
 * Bridges error logging in services and API routes to Sentry.
 * Use this instead of bare console.error() for unexpected failures
 * so errors are both logged via structured logger AND sent to Sentry.
 *
 * Routes through @zuiio/capture which dispatches to the registered telemetry
 * handler (Sentry) and always logs to console.error.
 *
 * For expected errors (validation, not-found), just throw the appropriate
 * AppError and let api-handler.ts handle it.
 */
import { capture } from "@zuiio/capture";
import { logger } from "@/lib/logger";

export function reportServerError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
) {
  // Local visibility via pino (structured logging)
  if (error) {
    logger.error({ err: error, ...context }, message);
  } else {
    logger.error(context ?? {}, message);
  }

  // Route through @zuiio/capture to telemetry handler (Sentry)
  capture(error ?? new Error(message), {
    context: `[server] ${message}`,
    ...context,
  });
}
