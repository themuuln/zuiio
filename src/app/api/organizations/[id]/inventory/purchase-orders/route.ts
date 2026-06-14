import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrder,
} from "@/lib/services/purchase-order-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") ?? undefined;
  const pos = await getPurchaseOrders(
    supabase,
    orgId,
    undefined,
    undefined,
    branchId,
  );
  return NextResponse.json({ data: pos });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const po = await createPurchaseOrder(supabase, orgId, body, user.id);
    return NextResponse.json({ data: po }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const poId = searchParams.get("poId") ?? searchParams.get("id");
    if (!poId) {
      return NextResponse.json(
        { error: { message: "poId required" } },
        { status: 400 },
      );
    }
    const body = await request.json();
    const po = await updatePurchaseOrder(supabase, poId, orgId, body);
    return NextResponse.json({ data: po });
  },
  { rateLimit: true, subscription: true },
);
