import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import type { Customer } from "@/lib/types";

export const GET = createRouteHandler(async ({ supabase, orgId, request }) => {
  const url = new URL(request.url);
  const vehicleId = url.searchParams.get("vehicle_id");
  if (!vehicleId) return ok(null);

  const [ownerResult, { data: lastWo, error: woError }] = await Promise.all([
    supabase
      .from("vehicle_owners")
      .select("customers(*)")
      .eq("organization_id", orgId)
      .eq("vehicle_id", vehicleId)
      .is("owned_until", null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("work_orders")
      .select("id, mechanic_id, notes")
      .eq("organization_id", orgId)
      .eq("vehicle_id", vehicleId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (ownerResult.error) throw new Error(ownerResult.error.message);
  if (woError) throw new Error(woError.message);
  if (!lastWo) return ok(null);

  const owner =
    (ownerResult.data?.customers as Customer | null | undefined) ?? null;

  const [{ data: services }, { data: parts }] = await Promise.all([
    supabase
      .from("work_order_services")
      .select("service_catalog_id, service_name, unit_price, quantity")
      .eq("work_order_id", lastWo.id)
      .eq("organization_id", orgId),
    supabase
      .from("work_order_parts")
      .select("part_name, part_number, unit_price, quantity")
      .eq("work_order_id", lastWo.id)
      .eq("organization_id", orgId),
  ]);

  return ok({
    services: services ?? [],
    parts: parts ?? [],
    mechanic_id: lastWo.mechanic_id,
    notes: lastWo.notes,
    owner,
  });
});
