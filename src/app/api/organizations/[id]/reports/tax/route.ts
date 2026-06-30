import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getTaxReport } from "@/lib/services/tax-report-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  // Get query params
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: { message: "startDate and endDate are required" } },
      { status: 400 },
    );
  }

  const report = await getTaxReport(supabase, orgId, {
    startDate,
    endDate,
  });

  return NextResponse.json({ data: report });
});
