/**
 * Server-side error reporting utility.
 *
 * Bridges error logging in services and API routes to Sentry.
 * Use this instead of bare console.error() for unexpected failures
 * so errors are both logged via structured logger AND sent to Sentry.
 *
 * For expected errors (validation, not-found), just throw the appropriate
 * AppError and let api-handler.ts handle it.
 */
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

export function reportServerError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
) {
  // Local visibility via pino
  if (error) {
    logger.error({ err: error, ...context }, message);
  } else {
    logger.error(context ?? {}, message);
  }

  // Sentry
  Sentry.withScope((scope) => {
    scope.setTag("source", "server");
    if (context) scope.setExtras(context);
    if (error instanceof Error) {
      scope.setExtras({ originalMessage: error.message });
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(message, "error");
    }
  });
}
