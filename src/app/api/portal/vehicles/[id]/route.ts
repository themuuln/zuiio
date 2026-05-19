import { NextResponse } from "next/server";
import { createPortalRouteHandler } from "@/lib/portal-auth";
import { NotFoundError } from "@/lib/errors";

export const GET = createPortalRouteHandler(
  async ({ customer, supabase, params }) => {
    const vehicleId = params.id;

    const vehicleIds = (
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
      .select("*")
      .eq("id", vehicleId)
      .is("deleted_at", null)
      .single();

    if (vehicleError || !vehicle) throw new NotFoundError("Vehicle not found");

    const [workOrdersResult, upcomingServicesResult] = await Promise.all([
      supabase
        .from("work_orders")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_service_schedules")
        .select("*")
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
          .select("*")
          .in("work_order_id", workOrderIds),
        supabase
          .from("work_order_parts")
          .select("*")
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

    return NextResponse.json({
      data: {
        vehicle,
        workOrders,
        upcomingServices: upcomingServicesResult.data ?? [],
      },
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
