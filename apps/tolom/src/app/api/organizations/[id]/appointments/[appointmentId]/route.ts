import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {
  deleteAppointment,
  getAppointment,
  updateAppointment,
} from "@/lib/services/appointment-service";
export const GET = createRouteHandler(
  async ({ params, supabase }) => {
    const appointment = await getAppointment(supabase, params.appointmentId);
    if (!appointment) {
      return apiError("NOT_FOUND", "Appointment not found", 404);
    }
    return ok(appointment);
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

export const PATCH = createRouteHandler(
  async ({ request, params, supabase, user }) => {
    const body = await request.json();
    const appointment = await updateAppointment(
      supabase,
      params.appointmentId,
      body,
      user.id,
    );
    return ok(appointment);
  },
  {
    rateLimit: true,
    requiredPermission: { resource: "customers", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ params, supabase, user }) => {
    await deleteAppointment(supabase, params.appointmentId, user.id);
    return ok(null);
  },
  {
    rateLimit: true,
    requiredPermission: { resource: "customers", action: "delete" },
  },
);
