import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  getInventoryBalances,
  getWeightedAverageCosts,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const [balances, avgCosts] = await Promise.all([
    getInventoryBalances(orgId),
    getWeightedAverageCosts(orgId),
  ]);
  const data = balances.map((b) => ({
    ...b,
    avg_unit_cost: avgCosts[b.part_id ?? ""] ?? b.default_price ?? 0,
  }));
  return NextResponse.json({ data });
});
