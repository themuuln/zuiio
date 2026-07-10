import type { NextRequest } from "next/server";

/**
 * Parse common list/query parameters from a Next API request.
 *
 * Most list endpoints support the same set of optional query params:
 * - `q` — search/filter text
 * - `page` — page number (1-based)
 * - `pageSize` — items per page
 * - `branch_id` — branch filter
 *
 * Usage:
 * ```ts
 * const { q, page, pageSize, branchId } = parseListParams(request);
 * ```
 */
export function parseListParams(request: NextRequest) {
  return {
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    page: Number(request.nextUrl.searchParams.get("page")) || undefined,
    pageSize: Number(request.nextUrl.searchParams.get("pageSize")) || undefined,
    branchId: request.nextUrl.searchParams.get("branch_id") ?? undefined,
  };
}
