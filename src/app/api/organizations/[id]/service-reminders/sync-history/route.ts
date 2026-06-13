import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { backfillSchedulesFromHistory } from "@/lib/services/service-reminder-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const POST = createRouteHandler(async ({ request, orgId, supabase }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = await mutationRateLimiter.check(ip);
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
  const synced = await backfillSchedulesFromHistory(supabase, orgId);
  return NextResponse.json({ data: { synced } });
});
