import { apiError, createRouteHandler, ok } from "@/lib/api-response";
import { reportServerError } from "@/lib/sentry-report-server";
import {
  type GlobalSearchResult,
  globalSearch,
} from "@/lib/services/global-search-service";

// GET /api/organizations/[id]/global-search?q=term&limit=5
// Global "workshop counter" search across customers, vehicles, work orders, parts.
export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim() ?? "";
  const rawLimit = searchParams.get("limit");
  const limit = rawLimit ? Number(rawLimit) : undefined;

  // Short queries return empty sections — the dialog shows a hint instead.
  if (query.length < 2) {
    const empty: GlobalSearchResult = {
      customers: [],
      vehicles: [],
      workOrders: [],
      parts: [],
    };
    return ok(empty);
  }

  try {
    const data = await globalSearch(supabase, orgId, query, {
      ...(limit && !Number.isNaN(limit) ? { limit } : {}),
    });
    return ok(data);
  } catch (error) {
    reportServerError("[Global Search API] Query error:", error);
    return apiError(
      "QUERY_ERROR",
      error instanceof Error ? error.message : "Query failed",
      500,
    );
  }
});
