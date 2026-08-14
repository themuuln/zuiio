import { apiError, createRouteHandler, ok } from "@/lib/api-response";
import { getTaxReport } from "@/lib/services/tax-report-service";
export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  // Get query params
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (!startDate || !endDate) {
    return apiError(
      "VALIDATION_ERROR",
      "startDate and endDate are required",
      400,
    );
  }

  const report = await getTaxReport(supabase, orgId, {
    startDate,
    endDate,
  });

  return ok(report);
});
