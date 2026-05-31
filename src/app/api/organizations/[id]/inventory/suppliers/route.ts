import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "@/lib/services/inventory-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId }) => {
  const suppliers = await getSuppliers(orgId);
  return NextResponse.json({ data: suppliers });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
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
  const supplier = await createSupplier(orgId, body, user.id);
  return NextResponse.json({ data: supplier }, { status: 201 });
});

export const PATCH = createRouteHandler(async ({ request, orgId }) => {
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
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("supplierId") ?? searchParams.get("id");
  if (!itemId) {
    return NextResponse.json(
      { error: { message: "supplierId required" } },
      { status: 400 },
    );
  }
  const body = await request.json();
  const supplier = await updateSupplier(itemId, orgId, body);
  return NextResponse.json({ data: supplier });
});

export const DELETE = createRouteHandler(async ({ request, orgId }) => {
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
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("supplierId") ?? searchParams.get("id");
  if (!itemId) {
    return NextResponse.json(
      { error: { message: "supplierId required" } },
      { status: 400 },
    );
  }
  await deleteSupplier(itemId, orgId);
  return NextResponse.json({ data: { success: true } });
});
