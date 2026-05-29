import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ supabase, orgId, request }) => {
  const url = new URL(request.url);
  const partName = url.searchParams.get("part_name");
  const vehicleMake = url.searchParams.get("vehicle_make");
  const vehicleModel = url.searchParams.get("vehicle_model");

  let query = supabase
    .from("part_price_history")
    .select(
      "unit_price, final_price, part_number, vehicle_make, vehicle_model, created_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (partName) query = query.ilike("part_name", partName);
  if (vehicleMake) query = query.eq("vehicle_make", vehicleMake);
  if (vehicleModel) query = query.eq("vehicle_model", vehicleModel);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return NextResponse.json({ data: data ?? [] });
});
