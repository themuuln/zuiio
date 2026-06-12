import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createSubscription,
  getOrganizationSubscription,
  renewSubscription,
  updateSubscription,
} from "@/lib/services/subscription-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const subscription = await getOrganizationSubscription(supabase, orgId);
  return NextResponse.json({ data: subscription });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
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

    if (body.action === "start-trial") {
      const subscription = await createSubscription(supabase, orgId);
      return NextResponse.json({ data: subscription });
    }

    if (body.action === "renew") {
      const subscription = await renewSubscription(supabase, orgId);
      return NextResponse.json({ data: subscription });
    }

    if (!body.planType) {
      throw new ValidationError("planType or action is required");
    }

    const subscription = await updateSubscription(supabase, orgId, body);
    return NextResponse.json({ data: subscription });
  },
);
