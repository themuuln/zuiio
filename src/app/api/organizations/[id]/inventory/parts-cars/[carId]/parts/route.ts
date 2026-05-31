import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  addPartsCarPart,
  getPartsCarParts,
} from "@/lib/services/parts-cars-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const parts = await getPartsCarParts(orgId, params.carId);
  return NextResponse.json({ data: parts });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, params }) => {
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
    const part = await addPartsCarPart(orgId, user.id, params.carId, body);
    return NextResponse.json({ data: part }, { status: 201 });
  },
);
