import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getOrganization,
  updateOrganization,
} from "@/lib/services/organization-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

/**
 * GET /api/organizations/[id]
 * Returns a single organization by ID.
 */
export const GET = createRouteHandler(async ({ orgId }) => {
  const org = await getOrganization(orgId);
  return NextResponse.json({ data: org });
});

/**
 * PATCH /api/organizations/[id]
 * Updates an organization's name or settings.
 */
export const PATCH = createRouteHandler(async ({ request, orgId }) => {
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
  const org = await updateOrganization(orgId, body);
  return NextResponse.json({ data: org });
});
