/**
 * Applies pagination (range/limit) to any Supabase query builder.
 *
 * @param query - Any Supabase query builder
 * @param page - 1-based page number (default: 1)
 * @param pageSize - Items per page (default: 20, max: 1000)
 * @returns The same query with `.range()` applied
 *
 * @example
 * const { data } = await withPagination(
 *   supabase.from("work_orders").select("*").eq("organization_id", orgId),
 *   2,  // page
 *   25, // pageSize
 * );
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
