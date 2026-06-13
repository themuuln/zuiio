import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createCustomerCommunication,
  getCustomerCommunications,
} from "@/lib/services/communication-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { customerId } = params;
  const communications = await getCustomerCommunications(
    supabase,
    orgId,
    customerId,
  );
  return NextResponse.json({ data: communications });
});

export const POST = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
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
    const { customerId } = params;
    const body = await request.json();
    const communication = await createCustomerCommunication(
      supabase,
      orgId,
      customerId,
      body,
      user.id,
    );
    return NextResponse.json({ data: communication }, { status: 201 });
  },
);
