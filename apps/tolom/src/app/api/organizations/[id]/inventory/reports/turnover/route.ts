import { ok, createRouteHandler } from "@/lib/api-response"
import { getInventoryTurnover } from "@/lib/services/inventory-reports-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const months = searchParams.get("months")
    ? Number.parseInt(searchParams.get("months")!, 10)
    : undefined;
  const branchId = searchParams.get("branch_id") ?? undefined;
  const data = await getInventoryTurnover(supabase, orgId, months, branchId);
  return ok(data);
});
