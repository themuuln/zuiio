import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deletePartsCar,
  getPartsCar,
  updatePartsCar,
} from "@/lib/services/parts-cars-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const car = await getPartsCar(supabase, orgId, params.carId);
  return NextResponse.json({ data: car });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
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
    const car = await updatePartsCar(supabase, orgId, params.carId, body);
    return NextResponse.json({ data: car });
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
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
    await deletePartsCar(supabase, orgId, params.carId);
    return NextResponse.json({ data: null }, { status: 204 });
  },
);
