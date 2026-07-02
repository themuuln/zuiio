import { NextResponse } from "next/server";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const GET = createPortalRouteHandler(async ({ customer, supabase }) => {
  const { data: ownerships, error: ownershipError } = await supabase
    .from("vehicle_owners")
    .select("vehicle_id")
    .eq("customer_id", customer.id)
    .is("owned_until", null);

  if (ownershipError) throw ownershipError;

  const vehicleIds = ownerships?.map((o) => o.vehicle_id) ?? [];

  if (vehicleIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: workOrders, error } = await supabase
    .from("work_orders")
    .select(
      "id, status, description, total, created_at, started_at, completed_at, vehicle:vehicle_id(id, plate_number, make, model, year)",
    )
    .in("vehicle_id", vehicleIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return NextResponse.json({ data: workOrders });
});
