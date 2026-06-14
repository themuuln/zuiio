import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deleteSupplier,
  getSupplier,
  updateSupplier,
} from "@/lib/services/inventory-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { supplierId } = params;
  const supplier = await getSupplier(supabase, supplierId, orgId);
  return NextResponse.json({ data: supplier });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params, supabase }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = await mutationRateLimiter.check(ip);
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
  const supplier = await updateSupplier(supabase, supplierId, orgId, body);
  return NextResponse.json({ data: supplier });
});

export const DELETE = createRouteHandler(async ({ request, orgId, params, supabase }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = await mutationRateLimiter.check(ip);
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
  await deleteSupplier(supabase, supplierId, orgId);
  return NextResponse.json({ data: null });
});
