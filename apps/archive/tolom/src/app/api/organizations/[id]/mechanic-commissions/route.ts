import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const supabase = await createClient();

  // Get completed work orders in the date range
  let woQuery = supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .is("deleted_at", null);

  if (startDate) woQuery = woQuery.gte("completed_at", `${startDate}T00:00:00`);
  if (endDate) woQuery = woQuery.lte("completed_at", `${endDate}T23:59:59`);

  const { data: workOrders } = await woQuery;
  if (!workOrders?.length) return ok([]);

  const woIds = workOrders.map((w) => w.id);

  // Get commission data for those WOs
  const { data: commissions } = await supabase
    .from("work_order_commissions")
    .select("mechanic_id, commission_amount")
    .in("work_order_id", woIds);

  if (!commissions?.length) return ok([]);

  // Aggregate per mechanic
  const commMap = new Map<string, number>();
  for (const c of commissions) {
    const mid = c.mechanic_id;
    commMap.set(
      mid,
      (commMap.get(mid) ?? 0) + Number(c.commission_amount ?? 0),
    );
  }

  // Fetch profile names
  const mechanicIds = [...commMap.keys()];
  const { data: profiles } =
    mechanicIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", mechanicIds)
      : { data: [] };

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

  const result = [...commMap.entries()]
    .map(([mechanic_id, total_commission]) => ({
      mechanic_id,
      mechanic_name: profileMap.get(mechanic_id) ?? "Unknown",
      total_commission,
    }))
    .sort((a, b) => b.total_commission - a.total_commission);

  return ok(result);
});
