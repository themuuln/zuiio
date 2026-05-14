import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { receivePurchaseOrder } from "@/lib/services/inventory-service";

export const POST = createRouteHandler(async ({ params, orgId }) => {
  await requireActiveSubscription(orgId);
  const po = await receivePurchaseOrder(params.purchaseOrderId, orgId);
  return NextResponse.json({ data: po });
});
