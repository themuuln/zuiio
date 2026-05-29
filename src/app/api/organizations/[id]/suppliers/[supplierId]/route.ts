import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { supplierId } = params;
  const supplier = await getSupplier(supplierId, orgId);
  return NextResponse.json({ data: supplier });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
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
  const { supplierId } = params;
  const body = await request.json();
  const supplier = await updateSupplier(supplierId, orgId, body);
  return NextResponse.json({ data: supplier });
});

export const DELETE = createRouteHandler(async ({ request, orgId, params }) => {
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
  const { supplierId } = params;
  await deleteSupplier(supplierId, orgId);
  return NextResponse.json({ data: null });
});
