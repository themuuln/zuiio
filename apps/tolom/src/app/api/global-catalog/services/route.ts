import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
export const GET = createSimpleRouteHandler(
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from("global_services_catalog")
      .select(
        "id, name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km, is_active",
      )
      .eq("is_active", true)
      .order("category")
      .order("name");

    if (error) {
      return apiError("QUERY_ERROR", error.message, 500);
    }
    return ok(data);
  },
  { requireAuth: false },
);
