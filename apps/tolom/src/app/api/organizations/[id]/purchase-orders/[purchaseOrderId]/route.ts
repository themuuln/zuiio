import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { receivePurchaseOrder } from "@/lib/services/inventory-service";
import { ok, apiError } from "@/lib/api-response";

export const GET = createRouteHandler(async ({ supabase, params, orgId }) => {
  const { purchaseOrderId } = params;

  const { data: po, error } = await supabase
    .from("purchase_orders")
    .select(
      `
      *,
      supplier:suppliers(name),
      items:purchase_order_items(
        *,
        part:parts_catalog(name, part_number)
      )
    `,
    )
    .eq("id", purchaseOrderId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error || !po) {
    return apiError("NOT_FOUND", "Purchase order not found", 404);
  }

  return ok(po);
});

export const PATCH = createRouteHandler(
  async ({ request, supabase, params, orgId, user }) => {
    const { purchaseOrderId } = params;
    const body = await request.json();

    const _allowedFields = ["status", "expectedAt", "notes"];
    const updates: Record<string, unknown> = { updated_by: user.id };

    if (body.status !== undefined) updates.status = body.status;
    if (body.expectedAt !== undefined) updates.expected_at = body.expectedAt;
    if (body.notes !== undefined) updates.notes = body.notes;

    if (Object.keys(updates).length <= 1) {
      throw new ValidationError("No valid fields to update");
    }

    const { data: po, error } = await supabase
      .from("purchase_orders")
      .update(updates)
      .eq("id", purchaseOrderId)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .select(
        "id, organization_id, supplier_id, order_number, status, total_amount, order_date, expected_at, received_at, notes, created_at, updated_at",
      )
      .single();

    if (error || !po) {
      return apiError("NOT_FOUND", "Purchase order not found", 404);
    }

    return ok(po);
  },
  { rateLimit: true, subscription: true },
);

export const POST = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { purchaseOrderId } = params;
    const body = await request.json();

    if (body.action === "receive") {
      const po = await receivePurchaseOrder(supabase, purchaseOrderId, orgId);
      return ok(po);
    }

    throw new ValidationError("Unsupported action. Use action: 'receive'.");
  },
  { rateLimit: true, subscription: true },
);
