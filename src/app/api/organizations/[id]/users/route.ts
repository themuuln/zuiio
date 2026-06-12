import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { createInvite } from "@/lib/services/invite-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { getOrganizationUsers, removeUser } from "@/lib/services/user-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const users = await getOrganizationUsers(supabase, orgId);
  return NextResponse.json({ data: users });
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
    const invite = await createInvite(supabase, orgId, body, user.id);
    return NextResponse.json({ data: invite }, { status: 201 });
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
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
    await removeUser(supabase, body.userId, orgId);
    return NextResponse.json({ success: true });
  },
);
