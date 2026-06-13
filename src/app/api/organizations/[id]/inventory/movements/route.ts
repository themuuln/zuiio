import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createMovement,
  getInventoryMovements,
} from "@/lib/services/inventory-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const movementType = searchParams.get("movement_type") ?? undefined;
  const branchId = searchParams.get("branch_id") ?? undefined;
  const limit = Number(searchParams.get("limit")) || 50;
  const movements = await getInventoryMovements(
    supabase,
    orgId,
    movementType,
    limit,
    undefined,
    undefined,
    branchId,
  );
  return NextResponse.json({ data: movements });
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
    const movement = await createMovement(supabase, orgId, body, user.id);
    return NextResponse.json({ data: movement }, { status: 201 });
  },
  { requiredPermission: { resource: "inventory", action: "create" } },
);
