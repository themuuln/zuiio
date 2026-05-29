import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  createService,
  getServices,
} from "@/lib/services/service-catalog-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const services = await getServices(orgId, category);
  return NextResponse.json({ data: services });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
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
  const service = await createService(orgId, body);
  return NextResponse.json({ data: service }, { status: 201 });
});
