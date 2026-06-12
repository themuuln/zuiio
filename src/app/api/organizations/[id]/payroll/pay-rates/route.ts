import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { listPayRates, upsertPayRate } from "@/lib/services/payroll-service";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");
    const rates = await listPayRates(supabase, orgId, branchId);
    return NextResponse.json({ data: rates });
  },
  { requiredPermission: { resource: "payroll", action: "read" } },
);

export const PUT = createRouteHandler(
  async ({ request, orgId, supabase }) => {
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
      supabase,
      orgId,
      mechanicId,
      hourlyRate,
      effectiveFrom,
    );
    return NextResponse.json({ data: rate });
  },
  { requiredPermission: { resource: "payroll", action: "write" } },
);
