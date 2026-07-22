import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { reportServerError } from "@/lib/sentry-report-server";
export const GET = createSimpleRouteHandler(
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from("global_parts_catalog")
      .select(
        "id, name, name_mn, category, description, part_number, unit, is_active",
      )
      .eq("is_active", true)
      .order("category")
      .order("name");

    if (error) {
      reportServerError("[Global Catalog API] Query error:", error);
      return apiError("QUERY_ERROR", error.message, 500);
    }

    return ok(data);
  },
  { requireAuth: false },
);
