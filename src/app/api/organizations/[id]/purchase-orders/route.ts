import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import {
  createPurchaseOrder,
  getPurchaseOrders,
} from "@/lib/services/inventory-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/organizations/[id]/purchase-orders
 * Lists all purchase orders with items and supplier info.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId } = await context.params;
    const orders = await getPurchaseOrders(orgId);
    return NextResponse.json({ data: orders });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/organizations/[id]/purchase-orders
 * Creates a new purchase order with items.
 * Body: { orderNumber, supplierId?, expectedAt?, notes?, items: [{ partId, quantityOrdered, unitCost, notes? }] }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId } = await context.params;
    const body = await request.json();
    const order = await createPurchaseOrder(orgId, body, user.id);
    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
