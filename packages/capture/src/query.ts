/**
 * Supabase query error capture wrapper.
 *
 * Wraps any Supabase query promise with automatic error capture.
 * Every query that goes through this utility automatically logs errors
 * via the `@zuiio/capture` system (console.error + telemetry handler).
 *
 * Usage:
 *   import { withDbCapture } from "@zuiio/capture";
 *   const { data, error } = await withDbCapture("getProfile",
 *     supabase.from("profiles").select("*").single()
 *   );
 */

import { captureDbError } from "./capture";

/**
 * Wrap a Supabase query promise with automatic error capture.
 *
 * @param label — Short human label (e.g. "getDashboardProfile")
 * @param promise — The query promise
 * @param ctx — Optional extra context (orgId, etc.)
 * @returns The same shape: `{ data, error }`
 */
export async function withDbCapture<R extends { data: unknown; error: unknown }>(
  label: string,
  promise: PromiseLike<R>,
  ctx?: { orgId?: string },
): Promise<R> {
  try {
    const result = await promise;

    if (result.error) {
      captureDbError("supabase_query_error", label, result.error, {
        ...(ctx?.orgId ? { orgId: ctx.orgId } : {}),
      });
    }

    return result;
  } catch (e) {
    captureDbError("supabase_exception", label, e, {
      ...(ctx?.orgId ? { orgId: ctx.orgId } : {}),
    });
    return { data: null, error: e } as unknown as R;
  }
}
