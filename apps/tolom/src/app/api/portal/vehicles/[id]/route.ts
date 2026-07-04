import { ok } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const GET = createPortalRouteHandler(
  async ({ customer, supabase, params }) => {
    const vehicleId = params.id;

    const vehicleIds =
      (
        await supabase
          .from("vehicle_owners")
          .select("vehicle_id")
          .eq("customer_id", customer.id)
          .is("owned_until", null)
      ).data?.map((v) => v.vehicle_id) ?? [];

    if (!vehicleIds.includes(vehicleId)) {
      throw new NotFoundError("Vehicle not found");
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select(
        "id, plate_number, make, model, year, vin, color, odometer, engine, fuel_type, transmission, trim, drivetrain, body_type, license_expiry_at, next_service_at, last_visit_at, notes, created_at",
      )
      .eq("id", vehicleId)
      .is("deleted_at", null)
      .single();

    if (vehicleError || !vehicle) throw new NotFoundError("Vehicle not found");

    const [workOrdersResult, upcomingServicesResult] = await Promise.all([
      supabase
        .from("work_orders")
        .select(
          "id, vehicle_id, status, complaint, description, total, bay_number, mechanic_id, created_at, completed_at",
        )
        .eq("vehicle_id", vehicleId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_service_schedules")
        .select(
          "id, service_name, interval_months, interval_km, last_service_date, last_service_odometer, next_due_date, next_due_km, reminder_enabled, notes",
        )
        .eq("vehicle_id", vehicleId)
        .is("deleted_at", null)
        .order("next_due_date", { ascending: true }),
    ]);

    if (workOrdersResult.error) throw workOrdersResult.error;

    let services: Record<string, unknown[]> = {};
    let parts: Record<string, unknown[]> = {};

    if (workOrdersResult.data.length > 0) {
      const workOrderIds = workOrdersResult.data.map((wo) => wo.id);

      const [servicesResult, partsResult] = await Promise.all([
        supabase
          .from("work_order_services")
          .select(
            "id, work_order_id, service_name, description, unit_price, quantity, final_price, notes, created_at",
          )
          .in("work_order_id", workOrderIds),
        supabase
          .from("work_order_parts")
          .select(
            "id, work_order_id, part_name, part_number, quantity, unit_price, final_price, notes, created_at",
          )
          .in("work_order_id", workOrderIds),
      ]);

      if (servicesResult.error) throw servicesResult.error;
      if (partsResult.error) throw partsResult.error;

      services = groupBy(servicesResult.data, "work_order_id");
      parts = groupBy(partsResult.data, "work_order_id");
    }

    const workOrders = workOrdersResult.data.map((wo) => ({
      ...wo,
      services: (services[wo.id] ?? []) as Record<string, unknown>[],
      parts: (parts[wo.id] ?? []) as Record<string, unknown>[],
    }));

    return ok({
      vehicle,
      workOrders,
      upcomingServices: upcomingServicesResult.data ?? [],
    });
  },
);

function groupBy<T extends Record<string, unknown>>(
  items: T[],
  key: string,
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const k = String(item[key]);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
  }
  return groups;
}
