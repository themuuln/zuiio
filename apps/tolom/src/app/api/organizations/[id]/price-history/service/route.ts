import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
export const GET = createRouteHandler(async ({ supabase, orgId, request }) => {
  const url = new URL(request.url);
  const serviceCatalogId = url.searchParams.get("service_catalog_id");
  const vehicleMake = url.searchParams.get("vehicle_make");
  const vehicleModel = url.searchParams.get("vehicle_model");

  let query = supabase
    .from("service_price_history")
    .select("unit_price, final_price, vehicle_make, vehicle_model, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (serviceCatalogId)
    query = query.eq("service_catalog_id", serviceCatalogId);
  if (vehicleMake) query = query.eq("vehicle_make", vehicleMake);
  if (vehicleModel) query = query.eq("vehicle_model", vehicleModel);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ok(data ?? []);
});
