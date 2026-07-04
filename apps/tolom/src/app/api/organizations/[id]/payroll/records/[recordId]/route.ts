import { ok, apiError, createRouteHandler } from "@/lib/api-response"
import { updatePayrollRecordStatus } from "@/lib/services/payroll-service";

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const body = await request.json();
    const { action } = body;
    const recordId = params.recordId;

    if (!action || !["approve", "pay"].includes(action)) {
      return apiError("BAD_REQUEST", "action must be 'approve' or 'pay'", 400);
    }

    const status = action === "pay" ? "paid" : "approved";
    const record = await updatePayrollRecordStatus(
      supabase,
      orgId,
      recordId,
      status,
    );
    return ok(record);
  },
  { requiredPermission: { resource: "payroll", action: "write" } },
);
