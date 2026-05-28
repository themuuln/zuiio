import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import {
  createVehicle,
  getVehicles,
  searchByPlate,
} from "@/lib/services/vehicle-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const searchRaw =
    request.nextUrl.searchParams.get("q") ??
    request.nextUrl.searchParams.get("plate") ??
    undefined;
  const search = searchRaw
    ? transliterateMongolianPlate(searchRaw.replace(/[\s-]/g, ""))
    : undefined;
  const customerId = request.nextUrl.searchParams.get("customer") ?? undefined;

  const vehicles = search
    ? await searchByPlate(orgId, search)
    : await getVehicles(orgId, { customerId });

  return NextResponse.json({ data: vehicles });
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
  const vehicle = await createVehicle(orgId, body, user.id);
  return NextResponse.json({ data: vehicle }, { status: 201 });
});
