import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createEstimate, getEstimates } from "@/lib/services/estimate-service";
import type { EstimateStatus } from "@/lib/types";

export const GET = createRouteHandler(
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const estimates = await getEstimates({
      status: (searchParams.get("status") as EstimateStatus) ?? undefined,
      customer_id: searchParams.get("customer_id") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
    });
    return NextResponse.json({ data: estimates });
  },
  { requiredPermission: { resource: "work_orders", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId }) => {
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
    const estimate = await createEstimate(orgId, body);
    return NextResponse.json({ data: estimate }, { status: 201 });
  },
  {
    requiredPermission: { resource: "work_orders", action: "create" },
  },
);
