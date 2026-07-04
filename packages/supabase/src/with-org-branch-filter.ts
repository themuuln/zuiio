/**
 * Conditionally applies a branch_id filter to any Supabase query builder.
 * Handles the `"all"` sentinel internally — treats it the same as
 * `null`/`undefined` (no-op). Callers never need to normalize `"all"`
 * before calling this function.
 *
 * @param query - Any Supabase query builder
 * @param branchId - Branch ID to filter by, or `"all"`/`null`/`undefined` for no filter
 * @returns The same query (possibly with `.eq("branch_id", branchId)` applied)
 *
 * @example
 * const { data } = await withBranchFilter(
 *   supabase.from("work_orders").select("id").eq("organization_id", orgId),
 *   branchId,
 * );
 */
export function withBranchFilter<T>(query: T, branchId?: string | null): T {
  if (!branchId || branchId === "all") return query;
  return (query as any).eq("branch_id", branchId) as T;
}
