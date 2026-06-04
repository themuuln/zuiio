import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors";

// ── Branch Filter ────────────────────────────────────────────

/**
 * Conditionally applies a branch_id filter to any Supabase query builder.
 * Handles the `"all"` sentinel internally — treats it the same as
 * `null`/`undefined` (no-op). Callers never need to normalize `"all"`
 * before calling this function.
 *
 * @param query - Any Supabase query builder (after `.select()`, etc.)
 * @param branchId - Branch ID to filter by, or `"all"`/`null`/`undefined` for no filter
 * @returns The same query (possibly with `.eq("branch_id", branchId)` applied)
 *
 * @example
 * const { data } = await withBranchFilter(
 *   supabase.from("work_orders").select("id").eq("organization_id", orgId),
 *   branchId,
 * );
 *
 * @example
 * // Inside withCache — supabase client must be created before the cached scope
 * const supabase = await createClient();
 * return withCache(["key", branchId ?? "all"], () => withBranchFilter(
 *   supabase.from("work_orders").select("*"),
 *   branchId,
 * ));
 */
export function withBranchFilter<T>(query: T, branchId?: string | null): T {
  if (!branchId || branchId === "all") return query;
  return (query as any).eq("branch_id", branchId) as T;
}

// ── Main Branch Resolution ───────────────────────────────────

/**
 * Resolves a branch ID from an optional input, falling back to the
 * organization's main branch when none is provided.
 *
 * @param supabase - Supabase client instance (must be created before cached scope)
 * @param orgId - Organization ID to look up branches for
 * @param branchId - Optional branch ID input (`"all"`/`null`/`undefined` triggers fallback)
 * @param options - Optional configuration
 * @param options.strict - When true (default), throws ValidationError if no main branch exists.
 *                         When false, returns null silently.
 * @returns The resolved branch ID, or null if non-strict and no main branch exists
 *
 * @example
 * // Strict mode (default) — throws if no main branch
 * const bid = await resolveBranchId(supabase, orgId, params.branchId);
 *
 * @example
 * // Non-strict — returns null if no main branch
 * const bid = await resolveBranchId(supabase, orgId, branchId, { strict: false });
 */
export async function resolveBranchId(
  supabase: SupabaseClient,
  orgId: string,
  branchId?: string | null,
  options?: { strict?: boolean },
): Promise<string | null> {
  // If caller provided a real branch ID, use it directly
  if (branchId && branchId !== "all") {
    return branchId;
  }

  // Fall back to main branch
  const { data: mainBranch } = await supabase
    .from("branches")
    .select("id")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();

  if (mainBranch) {
    return mainBranch.id;
  }

  // No main branch found
  const strict = options?.strict ?? true;
  if (strict) {
    throw new ValidationError(
      "No main branch found for this organization. " +
        "Please create a branch or provide a branch ID.",
    );
  }

  return null;
}
