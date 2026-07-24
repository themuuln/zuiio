import type { SupabaseClient } from "@supabase/supabase-js";
import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";

import { ForbiddenError } from "@/lib/errors";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  checkSuperAdmin,
  extendSubscriptionTrial,
  updateOrgSubscription,
} from "@/lib/services/admin-service";

async function guard(request: Request, supabase: SupabaseClient) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = await mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return apiError("RATE_LIMITED", "Too many requests", 429, {
      "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
    });
  }
  const isSuperAdmin = await checkSuperAdmin(supabase);
  if (!isSuperAdmin) throw new ForbiddenError();
}

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const guardResult = await guard(request, supabase);
    if (guardResult) return guardResult;
    const body = await request.json();

    if (body.action === "extend") {
      const subscription = await extendSubscriptionTrial(supabase, orgId);
      return ok(subscription);
    }

    const subscription = await updateOrgSubscription(supabase, orgId, body);
    return ok(subscription);
  },
);
