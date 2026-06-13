import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createService,
  getServices,
} from "@/lib/services/service-catalog-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const services = await getServices(supabase, orgId, category);
    return NextResponse.json({ data: services });
  },
  { requiredPermission: { resource: "services", action: "read" } },
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
    const service = await createService(supabase, orgId, body);
    return NextResponse.json({ data: service }, { status: 201 });
  },
  { requiredPermission: { resource: "services", action: "create" } },
);
