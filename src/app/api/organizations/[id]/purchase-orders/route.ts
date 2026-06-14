import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createPurchaseOrder,
  getPurchaseOrders,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const orders = await getPurchaseOrders(supabase, orgId);
  return NextResponse.json({ data: orders });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const order = await createPurchaseOrder(supabase, orgId, body, user.id);
    return NextResponse.json({ data: order }, { status: 201 });
  },
  { rateLimit: true, subscription: true },
);
