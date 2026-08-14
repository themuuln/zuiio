import { createRouteHandler } from "@/lib/api-handler";
import { noContent, ok } from "@/lib/api-response";
import {
  deleteServiceSchedule,
  getServiceSchedule,
  updateServiceSchedule,
} from "@/lib/services/service-reminder-service";
export const GET = createRouteHandler(
  async ({ params, supabase }) => {
    const { reminderId } = params;
    const schedule = await getServiceSchedule(supabase, reminderId);
    return ok(schedule);
  },
  { requiredPermission: { resource: "service_reminders", action: "read" } },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { reminderId } = params;
    const body = await request.json();
    const schedule = await updateServiceSchedule(
      supabase,
      reminderId,
      orgId,
      user.id,
      body,
    );
    return ok(schedule);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "service_reminders", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request: _request, orgId, params, supabase }) => {
    const { reminderId } = params;
    await deleteServiceSchedule(supabase, reminderId, orgId);
    return noContent();
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "service_reminders", action: "delete" },
  },
);
