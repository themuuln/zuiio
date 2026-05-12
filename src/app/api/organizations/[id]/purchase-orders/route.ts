import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getPurchaseOrders, createPurchaseOrder } from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const orders = await getPurchaseOrders(orgId);
  return NextResponse.json({ data: orders });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  const order = await createPurchaseOrder(orgId, body, user.id);
  return NextResponse.json({ data: order }, { status: 201 });
});
