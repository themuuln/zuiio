import { ok } from "@/lib/api-response";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const GET = createPortalRouteHandler(async ({ customer, supabase }) => {
  // Find customer's vehicles: primary ownership OR still actively owned
  const { data: ownerships } = await supabase
    .from("vehicle_owners")
    .select("vehicle_id, owned_until, is_primary")
    .eq("customer_id", customer.id);

  const vehicleIds = Array.from(
    new Set(
      (ownerships ?? [])
        .filter((o) => o.owned_until === null || o.is_primary === true)
        .map((o) => o.vehicle_id),
    ),
  );

  if (vehicleIds.length === 0) {
    return ok([]);
  }

  // Fetch inspections scoped to customer's vehicles
  const { data: inspections, error: inspError } = await supabase
    .from("digital_vehicle_inspections")
    .select("*")
    .in("vehicle_id", vehicleIds)
    .in("status", ["sent", "partially_approved", "approved", "converted"])
    .order("created_at", { ascending: false });

  if (inspError) throw inspError;
  if (!inspections || inspections.length === 0) return ok([]);

  // Batch-fetch vehicle info
  const uniqueVehicleIds = [...new Set(inspections.map((i) => i.vehicle_id))];
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, make, model, year")
    .in("id", uniqueVehicleIds);

  const vehicleMap = new Map((vehicles ?? []).map((v) => [v.id, v]));

  // Batch-fetch items for all inspections (lightweight projection)
  const { data: allItems } = await supabase
    .from("dvi_inspection_items")
    .select(
      "id, inspection_id, category, item_name, condition, severity, estimated_cost, customer_approved, has_photo",
    )
    .in(
      "inspection_id",
      inspections.map((i) => i.id),
    );

  const itemsByInspection = new Map<string, typeof allItems>();
  for (const item of allItems ?? []) {
    const group = itemsByInspection.get(item.inspection_id) ?? [];
    group.push(item);
    itemsByInspection.set(item.inspection_id, group);
  }

  const result = inspections.map((inspection) => ({
    id: inspection.id,
    status: inspection.status,
    created_at: inspection.created_at,
    updated_at: inspection.updated_at,
    odometer: inspection.odometer,
    vehicle: vehicleMap.get(inspection.vehicle_id) ?? null,
    item_count: itemsByInspection.get(inspection.id)?.length ?? 0,
    items: itemsByInspection.get(inspection.id) ?? [],
  }));

  return ok(result);
});
