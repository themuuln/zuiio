import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { receivePurchaseOrder } from "@/lib/services/inventory-service";

export const POST = createRouteHandler(async ({ request, params, orgId }) => {
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
  const po = await receivePurchaseOrder(params.purchaseOrderId, orgId);
  return NextResponse.json({ data: po });
});
