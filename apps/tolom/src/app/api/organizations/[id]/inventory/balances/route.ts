import { createRouteHandler, ok } from "@/lib/api-response";
import {

  getInventoryBalances,
  getInventoryFast,
  getWeightedAverageCosts,
} from "@/lib/services/inventory-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") ?? undefined;
  const fast = searchParams.get("fast") === "true" && !branchId;
  if (fast) {
    const rows = await getInventoryFast(supabase, orgId, {
      search: searchParams.get("q") ?? undefined,
      lowStockOnly: searchParams.get("low_stock") === "true",
      limit: Number(searchParams.get("pageSize") ?? 50),
    });
    return ok(
      rows.map((r) => ({
        ...r,
        avg_unit_cost: r.avg_unit_cost ?? r.default_price ?? 0,
      })),
    );
  }

  const [balances, avgCosts] = await Promise.all([
    getInventoryBalances(supabase, orgId, branchId),
    getWeightedAverageCosts(supabase, orgId, branchId),
  ]);
  const data = balances.map((b) => ({
    ...b,
    avg_unit_cost: avgCosts[b.part_id ?? ""] ?? b.default_price ?? 0,
  }));
  return ok(data);
});
