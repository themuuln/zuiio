import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getPayrollRecords } from "@/lib/services/payroll-service";

export const GET = createRouteHandler(
  async ({ request, orgId }) => {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    const branchId = searchParams.get("branch_id");

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: { message: "Valid year and month (1-12) are required" } },
        { status: 400 },
      );
    }

    const records = await getPayrollRecords(orgId, year, month, branchId);
    return NextResponse.json({ data: records });
  },
  { requiredPermission: { resource: "payroll", action: "read" } },
);
