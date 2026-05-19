import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ supabase, orgId, request }) => {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  if (!customerId) return NextResponse.json({ data: null });

  const { data: ownedVehicles, error: oError } = await supabase
    .from("vehicle_owners")
    .select("vehicle_id")
    .eq("organization_id", orgId)
    .eq("customer_id", customerId)
    .is("owned_until", null);

  if (oError) throw new Error(oError.message);

  const vehicleIds = (ownedVehicles ?? []).map((o) => o.vehicle_id);

  let customerVehicles: { id: string; plate_number: string; make: string; model: string; year: number | null }[] = [];

  if (vehicleIds.length > 0) {
    const { data: vehicles, error: vError } = await supabase
      .from("vehicles")
      .select("id, plate_number, make, model, year")
      .eq("organization_id", orgId)
      .in("id", vehicleIds)
      .is("deleted_at", null)
      .order("last_visit_at", { ascending: false, nullsFirst: false });

    if (vError) throw new Error(vError.message);
    customerVehicles = vehicles ?? [];
  }

  const { data: lastVehicle } = await supabase
    .from("work_orders")
    .select("vehicle_id")
    .eq("organization_id", orgId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    data: {
      vehicles: customerVehicles,
      lastVehicleId: vehicleIds.includes(lastVehicle?.vehicle_id ?? "")
        ? lastVehicle?.vehicle_id ?? null
        : customerVehicles[0]?.id ?? null,
    },
  });
});
