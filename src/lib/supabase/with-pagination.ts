/**
 * Applies pagination (range/limit) to any Supabase query builder.
 *
 * Follows the same pattern as withBranchFilter — wraps the underlying query
 * builder rather than the final `.then()` call, so it works inline before
 * `.select()`, `.maybeSingle()`, etc.
 *
 * @param query - Any Supabase query builder (PostgrestFilterBuilder, etc.)
 * @param page - 1-based page number (default: 1)
 * @param pageSize - Number of items per page (default: 20, max: 1000)
 * @returns The same query with `.range()` applied
 *
 * @example
 * const { data, error } = await withPagination(
 *   supabase.from("work_orders").select("*").eq("organization_id", orgId),
 *   2,  // page
 *   25, // pageSize
 * );
 *
 * @example
 * // Combined with withBranchFilter
 * const q = withBranchFilter(
 *   supabase.from("work_orders").select("*"),
 *   branchId,
 * );
 * const { data, error } = await withPagination(q, page, pageSize).order("created_at", { ascending: false });
 *
 * @default page 1
 * @default pageSize 20
 */
export function withPagination<T>(
  query: T,
  page?: number,
  pageSize?: number,
): T {
  const p = Math.max(1, page ?? 1);
  const ps = Math.min(Math.max(1, pageSize ?? 20), 1000);
  const from = (p - 1) * ps;
  const to = from + ps - 1;
  return (query as any).range(from, to) as T;
}
