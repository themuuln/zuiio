import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getDashboardData } from "@/lib/services/report-service/dashboard";
import { checkSubscriptionStatus } from "@/lib/services/subscription-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const period =
    (searchParams.get("period") as "today" | "week" | "month" | "all") ??
    "month";
  const branchId = searchParams.get("branch_id") ?? null;

  const [dashboard, subscription] = await Promise.all([
    getDashboardData(supabase, orgId, period, branchId),
    checkSubscriptionStatus(supabase, orgId),
  ]);

  return ok({ dashboard, subscription });
});
