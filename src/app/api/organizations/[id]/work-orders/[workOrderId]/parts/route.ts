import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  addPartToWorkOrder,
  removePartFromWorkOrder,
  updateWorkOrderPartPrice,
} from "@/lib/services/work-order-service";

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
  const { workOrderId } = params;
  const body = await request.json();
  const part = await addPartToWorkOrder(workOrderId, orgId, body);
  return NextResponse.json({ data: part }, { status: 201 });
});

export const PATCH = createRouteHandler(async ({ request, params, orgId }) => {
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
  const partId = searchParams.get("partId");
  const body = await request.json();

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

  if (body.final_price !== undefined) {
    await updateWorkOrderPartPrice(partId, workOrderId, {
      final_price: body.final_price,
    });
  }

  return NextResponse.json({ data: null });
});

export const DELETE = createRouteHandler(async ({ request, params, orgId }) => {
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
