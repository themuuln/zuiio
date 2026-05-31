import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getSlowMovingStock } from "@/lib/services/inventory-reports-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const thresholdDays = params.thresholdDays
    ? Number.parseInt(params.thresholdDays, 10)
    : undefined;
  const data = await getSlowMovingStock(orgId, thresholdDays);
  return NextResponse.json({ data });
});
