import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getStockThresholds,
  setStockThreshold,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const thresholds = await getStockThresholds(orgId);
  return NextResponse.json({ data: thresholds });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const body = await request.json();
  const threshold = await setStockThreshold(orgId, body);
  return NextResponse.json({ data: threshold }, { status: 201 });
});
