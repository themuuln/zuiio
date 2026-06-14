import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
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
    return NextResponse.json({ data: appointments });
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const appointment = await createAppointment(supabase, body);
    return NextResponse.json({ data: appointment }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "customers", action: "create" },
  },
);
