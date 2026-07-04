import { ok, createRouteHandler } from "@/lib/api-response"
import {
  getInventoryBalances,
  getWeightedAverageCosts,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") ?? undefined;
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
