import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getUsageTrends } from "@/lib/services/inventory-reports-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const months = params.months ? Number.parseInt(params.months, 10) : undefined;
  const data = await getUsageTrends(orgId, months);
  return NextResponse.json({ data });
});
