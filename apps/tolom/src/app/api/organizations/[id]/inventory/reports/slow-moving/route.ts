import { createRouteHandler, ok } from "@/lib/api-response";
import { getSlowMovingStock } from "@/lib/services/inventory-reports-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const thresholdDays = searchParams.get("thresholdDays")
    ? Number.parseInt(searchParams.get("thresholdDays") ?? "30", 10)
    : undefined;
  const branchId = searchParams.get("branch_id") ?? undefined;
  const data = await getSlowMovingStock(
    supabase,
    orgId,
    thresholdDays,
    branchId,
  );
  return ok(data);
});
