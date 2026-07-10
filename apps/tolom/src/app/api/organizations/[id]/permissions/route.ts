import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const { data: permissions, error } = await supabase
      .from("permissions")
      .select("id, name, resource, action, description")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("resource")
      .order("action");

    if (error) {
      return apiError("FETCH_ERROR", error.message, 500);
    }

    return ok(permissions ?? []);
  },
  { minimumRole: "Org Owner" },
);
