/**
 * Applies an organization_id filter to any Supabase query builder.
 *
 * Safe to chain — no-op when orgId is empty/null.
 *
 * @param query - Any Supabase query builder
 * @param orgId - Organization ID to filter by (empty/null skips the filter)
 * @returns The same query with `.eq("organization_id", orgId)` applied
 *
 * @example
 * const { data } = await withOrgScope(
 *   supabase.from("work_orders").select("*"),
 *   orgId,
 * );
 *
 * @example
 * // Chained with withBranchFilter
 * const q = withOrgScope(supabase.from("work_orders").select("*"), orgId);
 * const { data } = await withBranchFilter(q, branchId);
 */
export function withOrgScope<T>(query: T, orgId?: string | null): T {
  if (!orgId) return query;
  return (query as any).eq("organization_id", orgId) as T;
}
