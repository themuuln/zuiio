import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getInventoryBalances } from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const balances = await getInventoryBalances(orgId);
  return NextResponse.json({ data: balances });
});
