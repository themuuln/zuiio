import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { receivePurchaseOrder } from "@/lib/services/inventory-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string; purchaseOrderId: string }>;
};

/**
 * GET /api/organizations/[id]/purchase-orders/[purchaseOrderId]
 * Returns a single purchase order with items.
 * The getPurchaseOrders list route returns full PO data, so for a single PO
 * we fetch it from the supabase client directly with joins.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, purchaseOrderId } = await context.params;

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
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Purchase order not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: po });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/organizations/[id]/purchase-orders/[purchaseOrderId]
 * Updates a purchase order. Only certain fields can be changed after creation.
 * Body: { status?, expectedAt?, notes? }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, purchaseOrderId } = await context.params;
    const body = await request.json();

    const allowedFields = ["status", "expectedAt", "notes"];
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
      .select("*")
      .single();

    if (error || !po) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Purchase order not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: po });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/organizations/[id]/purchase-orders/[purchaseOrderId]/receive
 * Marks the PO as received, records inventory movements for all items.
 * Body: { action: "receive" }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, purchaseOrderId } = await context.params;
    const body = await request.json();

    if (body.action === "receive") {
      const po = await receivePurchaseOrder(purchaseOrderId, orgId);
      return NextResponse.json({ data: po });
    }

    throw new ValidationError("Unsupported action. Use action: 'receive'.");
  } catch (error) {
    return handleApiError(error);
  }
}
