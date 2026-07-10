import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const { data: roles, error } = await supabase
    .from("roles")
    .select("id, name, description, is_system")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) {
    return apiError("FETCH_ERROR", error.message, 500);
  }

  return ok(roles ?? []);
});
