import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { receivePurchaseOrder } from "@/lib/services/purchase-order-service";
export const POST = createRouteHandler(
  async ({ params, orgId, supabase, user }) => {
    const po = await receivePurchaseOrder(
      supabase,
      params.purchaseOrderId,
      orgId,
      user.id,
    );
    return ok(po);
  },
  { rateLimit: true, subscription: true },
);
