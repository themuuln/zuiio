import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ForbiddenError } from "@/lib/errors";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  checkSuperAdmin,
  extendSubscriptionTrial,
  updateOrgSubscription,
} from "@/lib/services/admin-service";

async function guard(request: Request, supabase: SupabaseClient) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    throw {
      response: NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      ),
    };
  }
  const isSuperAdmin = await checkSuperAdmin(supabase);
  if (!isSuperAdmin) throw new ForbiddenError();
}

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    await guard(request, supabase);
    const body = await request.json();

    if (body.action === "extend") {
      const subscription = await extendSubscriptionTrial(supabase, orgId);
      return NextResponse.json({ data: subscription });
    }

    const subscription = await updateOrgSubscription(supabase, orgId, body);
    return NextResponse.json({ data: subscription });
  },
);
