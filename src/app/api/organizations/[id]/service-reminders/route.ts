import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createServiceSchedule,
  getServiceSchedules,
} from "@/lib/services/service-reminder-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicle_id") ?? undefined;
  const branchId = searchParams.get("branch_id");
  const schedules = await getServiceSchedules(
    supabase,
    orgId,
    vehicleId,
    branchId,
  );
  return NextResponse.json({ data: schedules });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
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
    const schedule = await createServiceSchedule(
      supabase,
      orgId,
      user.id,
      body,
    );
    return NextResponse.json({ data: schedule }, { status: 201 });
  },
);
