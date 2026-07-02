import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getPurchaseOrderItems } from "@/lib/services/purchase-order-service";

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const poId = params.purchaseOrderId;
  const items = await getPurchaseOrderItems(supabase, poId);
  return NextResponse.json({ data: items });
});
