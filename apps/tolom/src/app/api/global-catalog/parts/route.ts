import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { reportServerError } from "@/lib/sentry-report-server";
import {
  type GlobalPartSearchFilters,
  searchGlobalParts,
} from "@/lib/services/global-catalog-service";

export const GET = createSimpleRouteHandler(
  async ({ request, supabase }) => {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const rawLimit = searchParams.get("limit");
    const limit = rawLimit ? parseInt(rawLimit, 10) : undefined;
    const rawOffset = searchParams.get("offset");
    const offset = rawOffset ? parseInt(rawOffset, 10) : undefined;

    const filters: GlobalPartSearchFilters = {};
    if (category) filters.category = category;
    if (limit && !Number.isNaN(limit) && limit > 0) filters.limit = limit;
    if (offset && !Number.isNaN(offset) && offset >= 0) filters.offset = offset;

    try {
      const data = await searchGlobalParts(supabase, query, filters);
      return ok(data);
    } catch (error) {
      reportServerError("[Global Catalog API] Query error:", error);
      return apiError(
        "QUERY_ERROR",
        error instanceof Error ? error.message : "Query failed",
        500,
      );
    }
  },
  { requireAuth: false },
);
