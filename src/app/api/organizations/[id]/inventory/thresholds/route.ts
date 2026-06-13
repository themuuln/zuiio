import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getStockThresholds,
  setStockThreshold,
} from "@/lib/services/inventory-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") ?? undefined;
  const thresholds = await getStockThresholds(supabase, orgId, branchId);
  return NextResponse.json({ data: thresholds });
});

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
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
    const body = await request.json();
    const threshold = await setStockThreshold(supabase, orgId, body);
    return NextResponse.json({ data: threshold }, { status: 201 });
  },
  { requiredPermission: { resource: "inventory", action: "create" } },
);
