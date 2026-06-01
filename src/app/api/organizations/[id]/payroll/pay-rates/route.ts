import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { listPayRates, upsertPayRate } from "@/lib/services/payroll-service";

export const GET = createRouteHandler(
  async ({ orgId }) => {
    const rates = await listPayRates(orgId);
    return NextResponse.json({ data: rates });
  },
  { requiredPermission: { resource: "payroll", action: "read" } },
);

export const PUT = createRouteHandler(
  async ({ request, orgId }) => {
    const body = await request.json();
    const { mechanicId, hourlyRate, effectiveFrom } = body;
    if (!mechanicId || !hourlyRate || !effectiveFrom) {
      return NextResponse.json(
        {
          error: {
            message: "mechanicId, hourlyRate, and effectiveFrom are required",
          },
        },
        { status: 400 },
      );
    }
    const rate = await upsertPayRate(
      orgId,
      mechanicId,
      hourlyRate,
      effectiveFrom,
    );
    return NextResponse.json({ data: rate });
  },
  { requiredPermission: { resource: "payroll", action: "write" } },
);
