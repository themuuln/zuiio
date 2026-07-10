import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import { createEstimate, getEstimates } from "@/lib/services/estimate-service";
import type { EstimateStatus } from "@/lib/types";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(
  async ({ request, supabase, orgId }) => {
    const { searchParams } = new URL(request.url);
    const result = await getEstimates(supabase, orgId, {
      status: (searchParams.get("status") as EstimateStatus) ?? undefined,
      customer_id: searchParams.get("customer_id") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      branchId: searchParams.get("branch_id") ?? undefined,
      search: searchParams.get("q") ?? undefined,
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,
      pageSize: searchParams.get("pageSize")
        ? Number(searchParams.get("pageSize"))
        : undefined,
    });
    return ok({ data: result.data, count: result.count });
  },
  { requiredPermission: { resource: "work_orders", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const estimate = await createEstimate(supabase, orgId, body);
    return created(estimate);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "create" },
  },
);
