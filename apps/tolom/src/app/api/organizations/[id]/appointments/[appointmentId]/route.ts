import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteAppointment,
  getAppointment,
  updateAppointment,
} from "@/lib/services/appointment-service";

export const GET = createRouteHandler(
  async ({ params, supabase }) => {
    const appointment = await getAppointment(supabase, params.appointmentId);
    if (!appointment) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Appointment not found" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: appointment });
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

export const PATCH = createRouteHandler(
  async ({ request, params, supabase }) => {
    const body = await request.json();
    const appointment = await updateAppointment(
      supabase,
      params.appointmentId,
      body,
    );
    return NextResponse.json({ data: appointment });
  },
  {
    rateLimit: true,
    requiredPermission: { resource: "customers", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, params, supabase }) => {
    await deleteAppointment(supabase, params.appointmentId);
    return NextResponse.json({ data: null });
  },
  {
    rateLimit: true,
    requiredPermission: { resource: "customers", action: "delete" },
  },
);
