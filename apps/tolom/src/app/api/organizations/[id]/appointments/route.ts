import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {
  createAppointment,
  getAppointments,
} from "@/lib/services/appointment-service";
import type { AppointmentStatus } from "@/lib/types";

export const GET = createRouteHandler(
  async ({ request, supabase }) => {
    const { searchParams } = new URL(request.url);
    const appointments = await getAppointments(supabase, {
      status: (searchParams.get("status") as AppointmentStatus) ?? undefined,
      mechanic_id: searchParams.get("mechanic") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      customer_id: searchParams.get("customer_id") ?? undefined,
      branchId: searchParams.get("branch_id") ?? undefined,
    });
    return ok(appointments);
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, supabase }) => {
    const body = await request.json();
    const appointment = await createAppointment(supabase, body);
    return created(appointment);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "customers", action: "create" },
  },
);
