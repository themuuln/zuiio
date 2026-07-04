import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { cancelRefund } from "@/lib/services/refund-service";

export const PATCH = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { refundId } = params;
    const refund = await cancelRefund(supabase, refundId, orgId);
    return ok(refund);
  },
  { requiredPermission: { resource: "refunds", action: "update" } },
);
