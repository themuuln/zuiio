import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";

export const GET = createRouteHandler(async ({ params, supabase, orgId }) => {
  const { partId } = params;

  const { data, error } = await supabase
    .from("vehicle_model_parts")
    .select(
      "id, part_id, vehicle_model_id, specific_price, compatibility_notes, created_at, updated_at, vehicle_model:vehicle_models!vehicle_model_id(id, make, model)",
    )
    .eq("part_id", partId)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ok(data ?? []);
});
