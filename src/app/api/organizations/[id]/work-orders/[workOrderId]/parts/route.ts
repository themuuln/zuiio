import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  addPartToWorkOrder,
  removePartFromWorkOrder,
} from "@/lib/services/work-order-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const POST = createRouteHandler(async ({ request, params, orgId }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { workOrderId } = params;
  const body = await request.json();
  const part = await addPartToWorkOrder(workOrderId, orgId, body);
  return NextResponse.json({ data: part }, { status: 201 });
});

export const DELETE = createRouteHandler(async ({ request, params, orgId }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { workOrderId } = params;
  const { searchParams } = new URL(request.url);
  const partId = searchParams.get("partId");

  if (!partId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "partId query param required",
        },
      },
      { status: 400 },
    );
  }

  await removePartFromWorkOrder(partId, workOrderId);
  return NextResponse.json({ data: null });
});
