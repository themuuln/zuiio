import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { calculateMonthlyPayroll } from "@/lib/services/payroll-service";

export const POST = createRouteHandler(
  async ({ request, orgId }) => {
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: { message: "Valid year and month (1-12) are required" } },
        { status: 400 },
      );
    }

    const records = await calculateMonthlyPayroll(orgId, year, month);
    return NextResponse.json({ data: records });
  },
  { requiredPermission: { resource: "payroll", action: "write" } },
);
