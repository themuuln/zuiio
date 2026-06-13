import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deleteService,
  getService,
  updateService,
} from "@/lib/services/service-catalog-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const { serviceId } = params;
  const service = await getService(supabase, serviceId);
  return NextResponse.json({ data: service });
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
    const { serviceId } = params;
    const body = await request.json();
    const service = await updateService(supabase, serviceId, orgId, body);
    return NextResponse.json({ data: service });
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
    const { serviceId } = params;
    await deleteService(supabase, serviceId, orgId);
    return NextResponse.json({ data: null });
  },
);
