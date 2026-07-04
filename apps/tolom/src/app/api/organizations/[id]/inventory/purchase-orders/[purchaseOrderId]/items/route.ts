import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { getPurchaseOrderItems } from "@/lib/services/purchase-order-service";

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const poId = params.purchaseOrderId;
  const items = await getPurchaseOrderItems(supabase, poId);
  return ok(items);
});
