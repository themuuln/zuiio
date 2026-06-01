import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { updatePayrollRecordStatus } from "@/lib/services/payroll-service";

export const PATCH = createRouteHandler(
  async ({ request, orgId, params }) => {
    const body = await request.json();
    const { action } = body;
    const recordId = params.recordId;

    if (!action || !["approve", "pay"].includes(action)) {
      return NextResponse.json(
        { error: { message: "action must be 'approve' or 'pay'" } },
        { status: 400 },
      );
    }

    const status = action === "pay" ? "paid" : "approved";
    const record = await updatePayrollRecordStatus(orgId, recordId, status);
    return NextResponse.json({ data: record });
  },
  { requiredPermission: { resource: "payroll", action: "write" } },
);
