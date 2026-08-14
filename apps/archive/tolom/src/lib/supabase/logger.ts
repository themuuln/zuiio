/**
 * Lightweight Supabase query result logger.
 *
 * Captures two failure modes that Sentry never sees:
 *  1. Explicit PostgREST errors (error !== null)
 *  2. Silent RLS blocks — UPDATE/DELETE/INSERT returning null data
 *     when the caller expected affected rows
 *
 * Usage:
 *   const { data, error } = await supabase.from("profiles").update(...).eq("id", id);
 *   logSupabaseResult(error, "profiles.update", { id });
 *
 *   // For mutations where null data is suspicious:
 *   const { data, error } = await supabase.from("profiles").update(...).eq("id", id).select();
 *   logSupabaseResult(error, "profiles.update", { id }, data);
 */
import * as Sentry from "@sentry/nextjs";

type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

/**
 * Log a Supabase result to Sentry.
 *
 * @param error     - PostgREST error object (null if no error)
 * @param operation - Human-readable label, e.g. "profiles.update", "work_orders.insert"
 * @param context   - Key metadata (table, IDs, org) for the Sentry event
 * @param data      - Optional result data; null on a mutation triggers a warning
 */
export function logSupabaseResult(
  error: SupabaseError | null,
  operation: string,
  context?: Record<string, unknown>,
  data?: unknown[] | null,
): void {
  // ── Explicit error ────────────────────────────────────────
  if (error) {
    Sentry.withScope((scope) => {
      scope.setLevel("warning");
      scope.setTag("source", "supabase");
      scope.setTag("operation", operation);
      if (context) scope.setExtras(context);
      Sentry.captureMessage(
        `Supabase error [${operation}]: ${error.message}`,
        "warning",
      );
    });
    return;
  }

  // ── Silent failure: null/empty data on a select-after-mutation ──
  if (data !== undefined && data === null) {
    Sentry.withScope((scope) => {
      scope.setLevel("warning");
      scope.setTag("source", "supabase");
      scope.setTag("operation", operation);
      scope.setTag("silent_rls_block", "true");
      if (context) scope.setExtras(context);
      Sentry.captureMessage(
        `Supabase silent null-data mutation [${operation}] — possible RLS block`,
        "warning",
      );
    });
  }
}
