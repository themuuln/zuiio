import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deletePart,
  getPart,
  updatePart,
} from "@/lib/services/inventory-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ params, supabase, orgId }) => {
  const { partId } = params;
  const part = await getPart(supabase, partId, orgId);
  return NextResponse.json({ data: part });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
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
    const { partId } = params;
    const body = await request.json();
    const part = await updatePart(supabase, partId, orgId, body);
    return NextResponse.json({ data: part });
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
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
    const { partId } = params;
    await deletePart(supabase, partId, orgId);
    return NextResponse.json({ data: null });
  },
);
