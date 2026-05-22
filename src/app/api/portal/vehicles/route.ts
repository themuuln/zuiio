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

  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("id, plate_number, make, model, year, vin, color, odometer, engine, fuel_type, transmission, last_visit_at, next_service_at, created_at")
    .in("id", vehicleIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return NextResponse.json({ data: vehicles });
});
