import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { receivePurchaseOrder } from "@/lib/services/purchase-order-service";

export const POST = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const po = await receivePurchaseOrder(
      supabase,
      params.purchaseOrderId,
      orgId,
    );
    return ok(po);
  },
  { rateLimit: true, subscription: true },
);
