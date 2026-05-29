import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  createCustomerNote,
  getCustomerNotes,
} from "@/lib/services/customer-note-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { customerId } = params;
  const notes = await getCustomerNotes(orgId, customerId);
  return NextResponse.json({ data: notes });
});

export const POST = createRouteHandler(
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
    const { customerId } = params;
    const body = await request.json();
    const note = await createCustomerNote(orgId, customerId, body, user.id);
    return NextResponse.json({ data: note }, { status: 201 });
  },
);
