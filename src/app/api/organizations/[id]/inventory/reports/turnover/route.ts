import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getInventoryTurnover } from "@/lib/services/inventory-reports-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const months = params.months ? Number.parseInt(params.months, 10) : undefined;
  const data = await getInventoryTurnover(orgId, months);
  return NextResponse.json({ data });
});
