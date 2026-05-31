import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/lib/services/appointment-service";

export const GET = createRouteHandler(
  async ({ params }) => {
    const appointment = await getAppointment(params.appointmentId);
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
  async ({ request, params }) => {
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
    const appointment = await updateAppointment(params.appointmentId, body);
    return NextResponse.json({ data: appointment });
  },
  {
    requiredPermission: { resource: "customers", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, params }) => {
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
    await deleteAppointment(params.appointmentId);
    return NextResponse.json({ data: null });
  },
  {
    requiredPermission: { resource: "customers", action: "delete" },
  },
);
