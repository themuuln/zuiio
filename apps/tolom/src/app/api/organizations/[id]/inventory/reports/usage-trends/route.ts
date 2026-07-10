import { createRouteHandler, ok } from "@/lib/api-response";
import { getUsageTrends } from "@/lib/services/inventory-reports-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const months = searchParams.get("months")
    ? Number.parseInt(searchParams.get("months") ?? "12", 10)
    : undefined;
  const branchId = searchParams.get("branch_id") ?? undefined;
  const data = await getUsageTrends(supabase, orgId, months, branchId);
  return ok(data);
});
