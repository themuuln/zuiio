import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  createVehicle,
  getVehicles,
  searchByPlate,
} from "@/lib/services/vehicle-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const searchRaw =
    request.nextUrl.searchParams.get("q") ??
    request.nextUrl.searchParams.get("plate") ??
    undefined;
  const search = searchRaw
    ? transliterateMongolianPlate(searchRaw.replace(/[\s-]/g, ""))
    : undefined;
  const customerId = request.nextUrl.searchParams.get("customer") ?? undefined;
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;

  const vehicles = search
    ? await searchByPlate(supabase, orgId, search)
    : await getVehicles(supabase, orgId, { customerId, branchId });

  return NextResponse.json({ data: vehicles });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
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
    const vehicle = await createVehicle(supabase, orgId, body, user.id);
    return NextResponse.json({ data: vehicle }, { status: 201 });
  },
);
