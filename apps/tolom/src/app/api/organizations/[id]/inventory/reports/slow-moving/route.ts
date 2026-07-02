import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getSlowMovingStock } from "@/lib/services/inventory-reports-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const thresholdDays = searchParams.get("thresholdDays")
    ? Number.parseInt(searchParams.get("thresholdDays")!, 10)
    : undefined;
  const branchId = searchParams.get("branch_id") ?? undefined;
  const data = await getSlowMovingStock(
    supabase,
    orgId,
    thresholdDays,
    branchId,
  );
  return NextResponse.json({ data });
});
