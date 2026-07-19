import * as Sentry from "@sentry/nextjs";

/**
 * Log an error to console AND report it to GlitchTip/Sentry.
 * Use this for caught errors that should still be tracked
 * (Supabase query failures, API errors, handled exceptions).
 */
export function captureError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${context}:`, message);
  Sentry.captureException(error, {
    tags: { context },
    level: "error",
  });
}
