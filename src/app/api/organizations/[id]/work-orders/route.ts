import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import type { WorkOrderStatus } from "@/lib/types";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  createWorkOrder,
  getWorkOrders,
} from "@/lib/services/work-order-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const filters = {
    status:
      (searchParams.get("status") as unknown as WorkOrderStatus) ?? undefined,
    mechanic_id: searchParams.get("mechanic") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    search: searchParams.get("q") ?? undefined,
  };

  const workOrders = await getWorkOrders(orgId, filters);
  return NextResponse.json({ data: workOrders });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
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
  const workOrder = await createWorkOrder(orgId, body);
  return NextResponse.json({ data: workOrder }, { status: 201 });
});
