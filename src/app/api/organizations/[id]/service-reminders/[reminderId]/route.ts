import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  deleteServiceSchedule,
  getServiceSchedule,
  updateServiceSchedule,
} from "@/lib/services/service-reminder-service";

export const GET = createRouteHandler(async ({ params }) => {
  const { reminderId } = params;
  const schedule = await getServiceSchedule(reminderId);
  return NextResponse.json({ data: schedule });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user }) => {
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
      reminderId,
      orgId,
      user.id,
      body,
    );
    return NextResponse.json({ data: schedule });
  },
);

export const DELETE = createRouteHandler(async ({ request, orgId, params }) => {
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
  await deleteServiceSchedule(reminderId, orgId);
  return NextResponse.json({ data: null });
});
