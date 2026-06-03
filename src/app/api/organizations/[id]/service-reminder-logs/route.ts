import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getReminderLogs } from "@/lib/services/service-reminder-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicle_id") ?? undefined;
  const branchId = searchParams.get("branch_id");
  const logs = await getReminderLogs(orgId, vehicleId, branchId);
  return NextResponse.json({ data: logs });
});
