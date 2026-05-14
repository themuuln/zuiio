import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ supabase, orgId, request }) => {
  const url = new URL(request.url);
  const vehicleId = url.searchParams.get("vehicle_id");
  if (!vehicleId) return NextResponse.json({ data: null });

  const { data: lastWo, error: woError } = await supabase
    .from("work_orders")
    .select("id, mechanic_id, notes")
    .eq("organization_id", orgId)
    .eq("vehicle_id", vehicleId)
    .eq("status", "Completed")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (woError) throw new Error(woError.message);
  if (!lastWo) return NextResponse.json({ data: null });

  const { data: services } = await supabase
    .from("work_order_services")
    .select("service_catalog_id, service_name, unit_price, quantity")
    .eq("work_order_id", lastWo.id)
    .eq("organization_id", orgId);

  const { data: parts } = await supabase
    .from("work_order_parts")
    .select("part_name, part_number, unit_price, quantity")
    .eq("work_order_id", lastWo.id)
    .eq("organization_id", orgId);

  return NextResponse.json({
    data: {
      services: services ?? [],
      parts: parts ?? [],
      mechanic_id: lastWo.mechanic_id,
      notes: lastWo.notes,
    },
  });
});
