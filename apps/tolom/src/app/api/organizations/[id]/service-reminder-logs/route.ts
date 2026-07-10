import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getReminderLogs } from "@/lib/services/service-reminder-service";
export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicle_id") ?? undefined;
  const branchId = searchParams.get("branch_id");
  const logs = await getReminderLogs(supabase, orgId, vehicleId, branchId);
  return ok(logs);
});
