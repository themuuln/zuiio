import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getPartsCar,
  updatePartsCar,
  deletePartsCar,
} from "@/lib/services/parts-cars-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const car = await getPartsCar(orgId, params.carId);
  return NextResponse.json({ data: car });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
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
  const car = await updatePartsCar(orgId, params.carId, body);
  return NextResponse.json({ data: car });
});

export const DELETE = createRouteHandler(async ({ request, orgId, params }) => {
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
  await deletePartsCar(orgId, params.carId);
  return NextResponse.json({ data: null }, { status: 204 });
});
