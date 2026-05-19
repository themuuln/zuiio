import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const pos = await getPurchaseOrders(orgId);
  return NextResponse.json({ data: pos });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
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
  const po = await createPurchaseOrder(orgId, body, user.id);
  return NextResponse.json({ data: po }, { status: 201 });
});

export const PATCH = createRouteHandler(async ({ request, orgId }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { searchParams } = new URL(request.url);
  const poId = searchParams.get("poId") ?? searchParams.get("id");
  if (!poId) {
    return NextResponse.json(
      { error: { message: "poId required" } },
      { status: 400 },
    );
  }
  const body = await request.json();
  const po = await updatePurchaseOrder(poId, orgId, body);
  return NextResponse.json({ data: po });
});
