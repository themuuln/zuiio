import { ok } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const GET = createPortalRouteHandler(
  async ({ customer, supabase, params }) => {
    const inspectionId = params.id;

    // Find customer's vehicles
    const { data: ownerships } = await supabase
      .from("vehicle_owners")
      .select("vehicle_id, owned_until, is_primary")
      .eq("customer_id", customer.id);

    const vehicleIds = new Set(
      (ownerships ?? [])
        .filter((o) => o.owned_until === null || o.is_primary === true)
        .map((o) => o.vehicle_id),
    );

    // Fetch the inspection
    const { data: inspection, error: inspError } = await supabase
      .from("digital_vehicle_inspections")
      .select("*")
      .eq("id", inspectionId)
      .single();

    if (inspError || !inspection) {
      throw new NotFoundError("Inspection not found");
    }

    // Verify the inspection belongs to one of the customer's vehicles
    if (!vehicleIds.has(inspection.vehicle_id)) {
      throw new NotFoundError("Inspection not found");
    }

    // Fetch vehicle details
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, plate_number, make, model, year, vin, color, odometer")
      .eq("id", inspection.vehicle_id)
      .single();

    // Fetch all inspection items
    const { data: items, error: itemsError } = await supabase
      .from("dvi_inspection_items")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("sort_order", { ascending: true });

    if (itemsError) throw itemsError;

    const estimatedTotalCost =
      items?.reduce((sum, item) => sum + (item.estimated_cost ?? 0), 0) ?? 0;

    return ok({
      ...inspection,
      vehicle: vehicle ?? null,
      items: items ?? [],
      estimated_total_cost: estimatedTotalCost,
    });
  },
);
