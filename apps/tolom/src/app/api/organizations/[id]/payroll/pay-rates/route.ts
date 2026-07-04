import { ok, apiError, createRouteHandler } from "@/lib/api-response"
import { listPayRates, upsertPayRate } from "@/lib/services/payroll-service";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");
    const rates = await listPayRates(supabase, orgId, branchId);
    return ok(rates);
  },
  { requiredPermission: { resource: "payroll", action: "read" } },
);

export const PUT = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const { mechanicId, hourlyRate, effectiveFrom } = body;
    if (!mechanicId || !hourlyRate || !effectiveFrom) {
      return apiError("BAD_REQUEST", "mechanicId, hourlyRate, and effectiveFrom are required", 400);
    }
    const rate = await upsertPayRate(
      supabase,
      orgId,
      mechanicId,
      hourlyRate,
      effectiveFrom,
    );
    return ok(rate);
  },
  { requiredPermission: { resource: "payroll", action: "write" } },
);
