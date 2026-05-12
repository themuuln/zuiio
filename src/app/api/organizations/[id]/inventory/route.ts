import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import {
  createMovement,
  createPart,
  createPurchaseOrder,
  createSupplier,
  getInventoryBalances,
  getInventoryMovements,
  getPartsCatalog,
  getPurchaseOrderItems,
  getPurchaseOrders,
  getStockThresholds,
  getSuppliers,
  receivePurchaseOrder,
  setStockThreshold,
  updatePart,
  updatePurchaseOrder,
  updateSupplier,
  deleteSupplier,
} from "@/lib/services/inventory-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "parts";

    switch (type) {
      case "parts": {
        const parts = await getPartsCatalog(orgId);
        return NextResponse.json({ data: parts });
      }
      case "balances": {
        const balances = await getInventoryBalances(orgId);
        return NextResponse.json({ data: balances });
      }
      case "movements": {
        const movementType = searchParams.get("movement_type") ?? undefined;
        const limit = Number(searchParams.get("limit")) || 50;
        const movements = await getInventoryMovements(orgId, movementType, limit);
        return NextResponse.json({ data: movements });
      }
      case "suppliers": {
        const suppliers = await getSuppliers(orgId);
        return NextResponse.json({ data: suppliers });
      }
      case "purchase-orders": {
        const pos = await getPurchaseOrders(orgId);
        return NextResponse.json({ data: pos });
      }
      case "purchase-order-items": {
        const poId = searchParams.get("po_id");
        if (!poId) return NextResponse.json({ error: { message: "po_id required" } }, { status: 400 });
        const items = await getPurchaseOrderItems(poId);
        return NextResponse.json({ data: items });
      }
      case "thresholds": {
        const thresholds = await getStockThresholds(orgId);
        return NextResponse.json({ data: thresholds });
      }
      default:
        return NextResponse.json({ error: { message: "Invalid type" } }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "part";
    const body = await request.json();

    switch (type) {
      case "part": {
        const part = await createPart(orgId, body, user.id);
        return NextResponse.json({ data: part }, { status: 201 });
      }
      case "movement": {
        const movement = await createMovement(orgId, body, user.id);
        return NextResponse.json({ data: movement }, { status: 201 });
      }
      case "supplier": {
        const supplier = await createSupplier(orgId, body, user.id);
        return NextResponse.json({ data: supplier }, { status: 201 });
      }
      case "purchase-order": {
        const po = await createPurchaseOrder(orgId, body, user.id);
        return NextResponse.json({ data: po }, { status: 201 });
      }
      case "receive-po": {
        const po = await receivePurchaseOrder(body.po_id, orgId);
        return NextResponse.json({ data: po });
      }
      case "threshold": {
        const threshold = await setStockThreshold(orgId, body);
        return NextResponse.json({ data: threshold }, { status: 201 });
      }
      default:
        return NextResponse.json({ error: { message: "Invalid type" } }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "part";
    const body = await request.json();
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ error: { message: "Item ID required" } }, { status: 400 });
    }

    switch (type) {
      case "part": {
        const part = await updatePart(itemId, orgId, body);
        return NextResponse.json({ data: part });
      }
      case "supplier": {
        const supplier = await updateSupplier(itemId, orgId, body);
        return NextResponse.json({ data: supplier });
      }
      case "purchase-order": {
        const po = await updatePurchaseOrder(itemId, orgId, body);
        return NextResponse.json({ data: po });
      }
      default:
        return NextResponse.json({ error: { message: "Invalid type" } }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "supplier";
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ error: { message: "Item ID required" } }, { status: 400 });
    }

    switch (type) {
      case "supplier": {
        await deleteSupplier(itemId, orgId);
        return NextResponse.json({ data: { success: true } });
      }
      default:
        return NextResponse.json({ error: { message: "Invalid type" } }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
