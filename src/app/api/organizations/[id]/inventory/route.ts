import { type NextRequest, NextResponse } from "next/server";

/**
 * Backward-compat redirect for old `?type=` inventory API.
 * New paths:
 *   GET/POST  /inventory/parts
 *   GET       /inventory/balances
 *   GET/POST  /inventory/movements
 *   GET/POST/PATCH/DELETE /inventory/suppliers
 *   GET/POST  /inventory/purchase-orders
 *   GET       /inventory/purchase-orders/[id]/items
 *   POST      /inventory/purchase-orders/[id]/receive
 *   GET/POST  /inventory/thresholds
 *
 * This file can be removed once all consumers migrate off ?type=.
 */
export const GET = redirectHandler;
export const POST = redirectHandler;
export const PATCH = redirectHandler;
export const DELETE = redirectHandler;

async function redirectHandler(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const params = await context.params;
  const orgId = params.id;
  const { searchParams, pathname } = new URL(request.url);
  const type = searchParams.get("type") ?? "parts";
  const method = request.method;
  const base = pathname;  // /api/organizations/{orgId}/inventory

  const urlMap: Record<string, Record<string, string>> = {
    GET: {
      parts: `/api/organizations/${orgId}/inventory/parts`,
      balances: `/api/organizations/${orgId}/inventory/balances`,
      movements: `/api/organizations/${orgId}/inventory/movements`,
      suppliers: `/api/organizations/${orgId}/inventory/suppliers`,
      "purchase-orders": `/api/organizations/${orgId}/inventory/purchase-orders`,
      thresholds: `/api/organizations/${orgId}/inventory/thresholds`,
    },
    POST: {
      part: `/api/organizations/${orgId}/inventory/parts`,
      movement: `/api/organizations/${orgId}/inventory/movements`,
      supplier: `/api/organizations/${orgId}/inventory/suppliers`,
      "purchase-order": `/api/organizations/${orgId}/inventory/purchase-orders`,
      threshold: `/api/organizations/${orgId}/inventory/thresholds`,
    },
    PATCH: {
      part: `/api/organizations/${orgId}/inventory/parts`,
      supplier: `/api/organizations/${orgId}/inventory/suppliers`,
      "purchase-order": `/api/organizations/${orgId}/inventory/purchase-orders`,
    },
    DELETE: {
      supplier: `/api/organizations/${orgId}/inventory/suppliers`,
    },
  };

  const methodMap = urlMap[method as keyof typeof urlMap];
  if (!methodMap?.[type]) {
    return NextResponse.json(
      { error: { message: `Unknown type "${type}" for method ${method}` } },
      { status: 400 },
    );
  }

  let target = methodMap[type];

  // Special case: purchase-order-items needs po_id as path param
  if (method === "GET" && type === "purchase-order-items") {
    const poId = searchParams.get("po_id");
    if (!poId) {
      return NextResponse.json(
        { error: { message: "po_id required" } },
        { status: 400 },
      );
    }
    target = `/api/organizations/${orgId}/inventory/purchase-orders/${poId}/items`;
  }

  // Special case: receive-po wasn't in POST URL map
  if (method === "POST" && type === "receive-po") {
    const body = await request.clone().json();
    const poId = body?.po_id;
    if (!poId) {
      return NextResponse.json(
        { error: { message: "po_id required in body" } },
        { status: 400 },
      );
    }
    target = `/api/organizations/${orgId}/inventory/purchase-orders/${poId}/receive`;
  }

  // Forward query params for search/filter
  const newUrl = new URL(target, request.url);
  for (const [key, value] of searchParams.entries()) {
    if (key !== "type" && key !== "po_id") {
      newUrl.searchParams.set(key, value);
    }
  }

  // Redirect with the same body
  return NextResponse.redirect(newUrl, { status: 308 });
}
