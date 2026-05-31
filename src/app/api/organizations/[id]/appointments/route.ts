import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  createAppointment,
  getAppointments,
} from "@/lib/services/appointment-service";
import type { AppointmentStatus } from "@/lib/types";

export const GET = createRouteHandler(
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const appointments = await getAppointments({
      status: (searchParams.get("status") as AppointmentStatus) ?? undefined,
      mechanic_id: searchParams.get("mechanic") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      customer_id: searchParams.get("customer_id") ?? undefined,
    });
    return NextResponse.json({ data: appointments });
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }
    const body = await request.json();
    const appointment = await createAppointment(body);
    return NextResponse.json({ data: appointment }, { status: 201 });
  },
  {
    requiredPermission: { resource: "customers", action: "create" },
  },
);
