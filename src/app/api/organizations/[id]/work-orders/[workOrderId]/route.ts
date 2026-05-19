import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  assignMechanic,
  cancelWorkOrder,
  getWorkOrder,
  updateWorkOrderStatus,
} from "@/lib/services/work-order-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ params, orgId }) => {
  const { workOrderId } = params;
  const wo = await getWorkOrder(workOrderId);
  return NextResponse.json({ data: wo });
});

export const PATCH = createRouteHandler(async ({ request, params, orgId }) => {
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

  // Handle status change
  if (body.status) {
    const wo = await updateWorkOrderStatus(
      workOrderId,
      orgId,
      body.status,
      body.notes,
    );
    return NextResponse.json({ data: wo });
  }

  // Handle mechanic assignment
  if (body.mechanic_id) {
    const assignment = await assignMechanic(
      workOrderId,
      orgId,
      body.mechanic_id,
    );
    return NextResponse.json({ data: assignment });
  }

  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message: "No valid action" } },
    { status: 400 },
  );
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
  await cancelWorkOrder(workOrderId, orgId);
  return NextResponse.json({ data: null });
});
