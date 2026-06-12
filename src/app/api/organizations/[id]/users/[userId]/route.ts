import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { updateMember } from "@/lib/services/user-service";

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
          },
        },
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
    const userId = params.userId;
    // body: { fullName?, phone?, roleId?, branchId? }
    await updateMember(supabase, userId, orgId, {
      fullName: body.fullName,
      phone: body.phone,
      roleId: body.roleId,
      branchId: body.branchId,
    });
    return NextResponse.json({ success: true });
  },
);
