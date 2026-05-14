import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";

interface PriceHistoryResponse {
  services: Record<string, { last_price: number; last_make?: string; last_model?: string }>;
  parts: Record<string, number>;
}

export const GET = createRouteHandler(async ({ supabase, orgId }) => {
  const { data: servicePrices, error: serviceError } = await supabase
    .from("service_price_history")
    .select("service_catalog_id, unit_price, vehicle_make, vehicle_model, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (serviceError) throw new Error(serviceError.message);

  const serviceMap: PriceHistoryResponse["services"] = {};
  const seenServices = new Set<string>();
  for (const row of servicePrices ?? []) {
    const sid = row.service_catalog_id as string;
    if (seenServices.has(sid)) continue;
    seenServices.add(sid);
    serviceMap[sid] = {
      last_price: Number(row.unit_price),
      last_make: row.vehicle_make ?? undefined,
      last_model: row.vehicle_model ?? undefined,
    };
  }

  const { data: partPrices, error: partError } = await supabase
    .from("part_price_history")
    .select("part_name, unit_price, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (partError) throw new Error(partError.message);

  const partMap: PriceHistoryResponse["parts"] = {};
  const seenParts = new Set<string>();
  for (const row of partPrices ?? []) {
    const pname = (row.part_name as string).toLowerCase();
    if (seenParts.has(pname)) continue;
    seenParts.add(pname);
    partMap[pname] = Number(row.unit_price);
  }

  return NextResponse.json({ data: { services: serviceMap, parts: partMap } });
});
