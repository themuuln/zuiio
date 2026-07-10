import { apiError, createRouteHandler, ok } from "@/lib/api-response";
import { getPayrollRecords } from "@/lib/services/payroll-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    const branchId = searchParams.get("branch_id");

    if (!year || !month || month < 1 || month > 12) {
      return apiError(
        "BAD_REQUEST",
        "Valid year and month (1-12) are required",
        400,
      );
    }

    const records = await getPayrollRecords(
      supabase,
      orgId,
      year,
      month,
      branchId,
    );
    return ok(records);
  },
  { requiredPermission: { resource: "payroll", action: "read" } },
);
