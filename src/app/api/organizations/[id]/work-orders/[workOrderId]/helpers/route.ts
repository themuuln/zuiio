import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  assignHelperToWorkOrder,
  removeHelperFromWorkOrder,
} from "@/lib/services/bay-view-service";

export const POST = createRouteHandler(
  async ({ request, params, orgId }) => {
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
    const { workOrderId } = params;
    const body = await request.json();
    const mechanicId = body?.mechanic_id;
    if (!mechanicId || typeof mechanicId !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "mechanic_id is required",
          },
        },
        { status: 400 },
      );
    }
    await assignHelperToWorkOrder(workOrderId, mechanicId);
    return NextResponse.json({ data: null }, { status: 201 });
  },
  { requiredPermission: { resource: "work_orders", action: "update" } },
);

export const DELETE = createRouteHandler(
  async ({ request, params, orgId }) => {
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
    const { workOrderId } = params;
    const { searchParams } = new URL(request.url);
    const mechanicId = searchParams.get("mechanicId");
    if (!mechanicId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "mechanicId query param required",
          },
        },
        { status: 400 },
      );
    }
    await removeHelperFromWorkOrder(workOrderId, mechanicId);
    return NextResponse.json({ data: null });
  },
  { requiredPermission: { resource: "work_orders", action: "update" } },
);
