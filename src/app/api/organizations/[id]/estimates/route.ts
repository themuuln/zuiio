import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { createEstimate, getEstimates } from "@/lib/services/estimate-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import type { EstimateStatus } from "@/lib/types";

export const GET = createRouteHandler(
  async ({ request, supabase, orgId }) => {
    const { searchParams } = new URL(request.url);
    const result = await getEstimates(supabase, orgId, {
      status: (searchParams.get("status") as EstimateStatus) ?? undefined,
      customer_id: searchParams.get("customer_id") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      branchId: searchParams.get("branch_id") ?? undefined,
      search: searchParams.get("q") ?? undefined,
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,
      pageSize: searchParams.get("pageSize")
        ? Number(searchParams.get("pageSize"))
        : undefined,
    });
    return NextResponse.json({ data: result.data, count: result.count });
  },
  { requiredPermission: { resource: "work_orders", action: "read" } },
);

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
    const estimate = await createEstimate(supabase, orgId, body);
    return NextResponse.json({ data: estimate }, { status: 201 });
  },
  {
    requiredPermission: { resource: "work_orders", action: "create" },
  },
);
