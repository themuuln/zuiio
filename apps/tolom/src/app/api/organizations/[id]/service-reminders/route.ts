import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {
  createServiceSchedule,
  getServiceSchedules,
} from "@/lib/services/service-reminder-service";
export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicle_id") ?? undefined;
    const branchId = searchParams.get("branch_id");
    const schedules = await getServiceSchedules(
      supabase,
      orgId,
      vehicleId,
      branchId,
    );
    return ok(schedules);
  },
  { requiredPermission: { resource: "service_reminders", action: "read" } },
);
export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const schedule = await createServiceSchedule(
      supabase,
      orgId,
      user.id,
      body,
    );
    return created(schedule);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "service_reminders", action: "create" },
  },
);
