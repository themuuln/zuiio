import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createPart,
  getPartsCatalog,
  updatePart,
} from "@/lib/services/inventory-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const parts = await getPartsCatalog(supabase, orgId);
    return NextResponse.json({ data: parts });
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
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
    const part = await createPart(supabase, orgId, body, user.id);
    return NextResponse.json({ data: part }, { status: 201 });
  },
  { requiredPermission: { resource: "inventory", action: "create" } },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
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
    const itemId = searchParams.get("partId") ?? searchParams.get("id");
    if (!itemId) {
      return NextResponse.json(
        { error: { message: "partId required" } },
        { status: 400 },
      );
    }
    const body = await request.json();
    const part = await updatePart(supabase, itemId, orgId, body);
    return NextResponse.json({ data: part });
  },
);
