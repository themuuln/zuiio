import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { receiveByBarcode } from "@/lib/services/purchase-order-service";

export const POST = createRouteHandler(
  async ({ request, params, orgId, supabase, user }) => {
    const body = await request.json().catch(() => ({}));
    const barcode = typeof body?.barcode === "string" ? body.barcode : "";
    if (!barcode.trim()) {
      return apiError("VALIDATION_ERROR", "Barcode is required", 400);
    }
    const item = await receiveByBarcode(
      supabase,
      params.purchaseOrderId,
      orgId,
      barcode,
      user.id,
    );
    return ok(item);
  },
  { rateLimit: true, subscription: true },
);
