import { apiError, createRouteHandler, ok } from "@/lib/api-response";
import { calculateMonthlyPayroll } from "@/lib/services/payroll-service";
export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const { year, month, branch_id } = body;

    if (!year || !month || month < 1 || month > 12) {
      return apiError(
        "BAD_REQUEST",
        "Valid year and month (1-12) are required",
        400,
      );
    }

    const records = await calculateMonthlyPayroll(
      supabase,
      orgId,
      year,
      month,
      branch_id ?? null,
    );
    return ok(records);
  },
  { requiredPermission: { resource: "payroll", action: "write" } },
);
