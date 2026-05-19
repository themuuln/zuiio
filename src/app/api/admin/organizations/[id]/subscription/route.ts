import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  checkSuperAdmin,
  updateOrgSubscription,
} from "@/lib/services/admin-service";
import { ForbiddenError } from "@/lib/errors";

export const PATCH = createRouteHandler(async ({ request, orgId }) => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) throw new ForbiddenError();

  const body = await request.json();
  const subscription = await updateOrgSubscription(orgId, body);
  return NextResponse.json({ data: subscription });
});
