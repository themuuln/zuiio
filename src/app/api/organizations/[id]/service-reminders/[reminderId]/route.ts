import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deleteServiceSchedule,
  getServiceSchedule,
  updateServiceSchedule,
} from "@/lib/services/service-reminder-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const { reminderId } = params;
  const schedule = await getServiceSchedule(supabase, reminderId);
  return NextResponse.json({ data: schedule });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
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
    const { reminderId } = params;
    const body = await request.json();
    const schedule = await updateServiceSchedule(
      supabase,
      reminderId,
      orgId,
      user.id,
      body,
    );
    return NextResponse.json({ data: schedule });
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
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
    const { reminderId } = params;
    await deleteServiceSchedule(supabase, reminderId, orgId);
    return NextResponse.json({ data: null });
  },
);
