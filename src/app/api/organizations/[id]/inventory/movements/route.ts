import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createMovement,
  getInventoryMovements,
} from "@/lib/services/inventory-service";

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
    const body = await request.json();
    const movement = await createMovement(supabase, orgId, body, user.id);
    return NextResponse.json({ data: movement }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);
