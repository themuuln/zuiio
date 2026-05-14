import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ supabase, orgId, request }) => {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  if (!customerId) return NextResponse.json({ data: null });

  const { data: vehicles, error: vError } = await supabase
    .from("vehicles")
    .select("id, plate_number, make, model, year")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("last_visit_at", { ascending: false, nullsFirst: false });

  if (vError) throw new Error(vError.message);

  const customerVehicles = (vehicles ?? []).filter((v) => true);

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
      lastVehicleId: lastVehicle?.vehicle_id ?? null,
    },
  });
});
