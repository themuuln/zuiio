import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";
import type {
  CreatePurchaseOrderParams,
  PaginatedResponse,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  UpdatePurchaseOrderParams,
} from "@/lib/types";
import { createCrudService } from "./create-crud-service";

// ── Factory for update operations ──────────────────────────────

const updateCrud = createCrudService<
  PurchaseOrder,
  never,
  UpdatePurchaseOrderParams
>({
  tableName: "purchase_orders",
  selectColumns:
    "id, organization_id, supplier_id, order_number, order_date, status, total_amount, notes, expected_at, received_at, created_at, updated_at, created_by, updated_by",
  cacheTagKey: (orgId: string) => cacheTags.purchaseOrders(orgId),
});

// ── Purchase Orders ───────────────────────────────────────────

/**
 * List purchase orders with supplier info and optional branch filter.
 */
export async function getPurchaseOrders(
  db: SupabaseClient,
  orgId: string,
  page?: number,
  pageSize?: number,
  branchId?: string | null,
): Promise<PaginatedResponse<PurchaseOrder>> {
  const effectivePage = Math.max(1, page ?? 1);
  const effectivePageSize = Math.min(100, Math.max(1, pageSize ?? 50));
  const from = (effectivePage - 1) * effectivePageSize;
  const to = from + effectivePageSize - 1;

  let query = db
    .from("purchase_orders")
    .select("*, supplier:suppliers(name)", { count: "exact" })
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (branchId) query = withBranchFilter(query, branchId);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as PurchaseOrder[],
    total: count ?? 0,
    page: effectivePage,
    pageSize: effectivePageSize,
    totalPages: Math.ceil((count ?? 0) / effectivePageSize),
  };
}

/**
 * Get purchase order items with part names.
 */
export async function getPurchaseOrderItems(
  db: SupabaseClient,
  poId: string,
): Promise<(PurchaseOrderItem & { part_name: string })[]> {
  const { data, error } = await db
    .from("purchase_order_items")
    .select(
      "id, purchase_order_id, organization_id, part_id, quantity_ordered, quantity_received, unit_cost, notes, created_at, updated_at, created_by, updated_by, part:parts_catalog(name)",
    )
    .eq("purchase_order_id", poId)
    .order("created_at");

  if (error) throw new Error(error.message);

  return (data ?? []).map((item: Record<string, unknown>) => ({
    ...item,
    part_name: (item.part as { name: string } | null)?.name ?? "Unknown",
  })) as (PurchaseOrderItem & { part_name: string })[];
}

/**
 * Create a purchase order with items.
 */
export async function createPurchaseOrder(
  db: SupabaseClient,
  orgId: string,
  params: CreatePurchaseOrderParams,
  userId: string,
): Promise<PurchaseOrder> {
  if (!params.items?.length)
    throw new ValidationError("At least one item is required");
  if (!params.order_number?.trim())
    throw new ValidationError("Order number is required");

  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });

  const totalAmount = params.items.reduce(
    (sum, item) => sum + item.unit_cost * item.quantity_ordered,
    0,
  );

  const { data: po, error: poError } = await db
    .from("purchase_orders")
    .insert({
      organization_id: orgId,
      branch_id: resolvedBranchId,
      supplier_id: params.supplier_id || null,
      order_number: params.order_number.trim(),
      status: "draft",
      notes: params.notes?.trim() || null,
      total_amount: totalAmount,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (poError || !po)
    throw new Error(poError?.message ?? "Failed to create PO");

  // Insert items
  const items = params.items.map((item) => ({
    organization_id: orgId,
    purchase_order_id: po.id,
    part_id: item.part_id,
    quantity_ordered: item.quantity_ordered,
    quantity_received: 0,
    unit_cost: item.unit_cost,
    notes: item.notes || null,
    created_by: userId,
    updated_by: userId,
  }));

  const { error: itemsError } = await db
    .from("purchase_order_items")
    .insert(items);

  if (itemsError)
    throw new Error(itemsError?.message ?? "Failed to add PO item");

  revalidateTag(cacheTags.purchaseOrders(orgId), "max");
  return po as unknown as PurchaseOrder;
}

/**
 * Update a purchase order (simple field update).
 */
export async function updatePurchaseOrder(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdatePurchaseOrderParams,
  userId_?: string,
): Promise<PurchaseOrder> {
  const userId = userId_ ?? (await db.auth.getUser()).data.user?.id;
  if (!userId) throw new NotFoundError("Not authenticated");
  return updateCrud.update(db, orgId, id, params, userId);
}

/**
 * Receive a purchase order — updates items, creates inventory movements,
 * and sets status to "received" or "partial".
 */
export async function receivePurchaseOrder(
  db: SupabaseClient,
  id: string,
  orgId: string,
  userId_?: string,
): Promise<PurchaseOrder> {
  const userId = userId_ ?? (await db.auth.getUser()).data.user?.id;

  // Get PO items
  const { data: items } = await db
    .from("purchase_order_items")
    .select("id, part_id, quantity_ordered, quantity_received, unit_cost")
    .eq("purchase_order_id", id);

  if (!items?.length) throw new ValidationError("No items to receive");

  const itemsToReceive = items.filter(
    (item) => item.quantity_ordered - item.quantity_received > 0,
  );

  if (itemsToReceive.length > 0) {
    const movements = itemsToReceive.map((item) => ({
      organization_id: orgId,
      part_id: item.part_id,
      movement_type: "purchase" as const,
      quantity: item.quantity_ordered - item.quantity_received,
      unit_cost: item.unit_cost,
      reference_type: "purchase_order" as const,
      reference_id: id,
      created_by: userId,
    }));

    const { error: mvError } = await db
      .from("inventory_movements")
      .insert(movements);
    if (mvError) throw new Error(mvError.message);

    await Promise.all(
      itemsToReceive.map(async (item) => {
        await db
          .from("purchase_order_items")
          .update({
            quantity_received: item.quantity_ordered,
            updated_by: userId,
          })
          .eq("id", item.id);

        await db
          .from("parts_catalog")
          .update({
            last_purchase_price: item.unit_cost,
            updated_by: userId,
          })
          .eq("id", item.part_id);
      }),
    );
  }

  // Capture existing PO for audit before status update
  const { data: existingRecord } = await db
    .from("purchase_orders")
    .select(
      "id, organization_id, supplier_id, order_number, status, total_amount, notes",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  // Determine new status from the POST-update state: every item that had an
  // outstanding quantity was fully received by the loop above.
  const allReceived = items.every(
    (i) =>
      i.quantity_received >= i.quantity_ordered ||
      itemsToReceive.some((t) => t.id === i.id),
  );
  const newStatus: PurchaseOrderStatus = allReceived ? "received" : "partial";

  const { data, error } = await db
    .from("purchase_orders")
    .update({
      status: newStatus,
      received_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, supplier_id, order_number, order_date, status, total_amount, notes, expected_at, received_at, created_at, updated_at, created_by, updated_by",
    )
    .single();

  if (error || !data) throw new NotFoundError("Purchase order not found");

  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: "purchase_orders",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
    old_data: existingRecord as Record<string, unknown> | undefined,
    new_data: data,
  });

  revalidateTag(cacheTags.purchaseOrders(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  return data as unknown as PurchaseOrder;
}
/**
 * Receive a single PO item by scanning its barcode.
 * Matches the barcode against parts_catalog, finds the open PO line item,
 * and increments quantity_received by 1 (or until quantity_ordered reached).
 */
export async function receiveByBarcode(
  db: SupabaseClient,
  poId: string,
  orgId: string,
  barcode: string,
  userId_?: string,
): Promise<PurchaseOrderItem> {
  const userId = userId_ ?? (await db.auth.getUser()).data.user?.id;

  // Find part by barcode
  const { data: part, error: partError } = await db
    .from("parts_catalog")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("barcode", barcode.trim())
    .is("deleted_at", null)
    .maybeSingle();

  if (partError || !part) {
    throw new ValidationError(`No part found with barcode: ${barcode}`);
  }

  // Find open PO line item for this part
  const { data: poItem, error: itemError } = await db
    .from("purchase_order_items")
    .select("id, part_id, quantity_ordered, quantity_received, unit_cost")
    .eq("purchase_order_id", poId)
    .eq("part_id", part.id)
    .single();

  if (itemError || !poItem) {
    throw new ValidationError(`This PO does not contain part: ${part.name}`);
  }

  const remaining = poItem.quantity_ordered - poItem.quantity_received;
  if (remaining <= 0) {
    throw new ValidationError(`Already fully received: ${part.name}`);
  }

  const newReceived = poItem.quantity_received + 1;

  // Create inventory movement
  const { error: mvError } = await db.from("inventory_movements").insert({
    organization_id: orgId,
    part_id: part.id,
    movement_type: "purchase",
    quantity: 1,
    unit_cost: poItem.unit_cost,
    reference_type: "purchase_order",
    reference_id: poId,
    created_by: userId,
  });
  if (mvError) throw new Error(mvError.message);

  // Update received quantity
  const { data: updated, error: updError } = await db
    .from("purchase_order_items")
    .update({ quantity_received: newReceived, updated_by: userId })
    .eq("id", poItem.id)
    .select("id, part_id, quantity_ordered, quantity_received, unit_cost")
    .single();

  if (updError || !updated)
    throw new Error(updError?.message ?? "Update failed");

  // Update part last purchase price
  await db
    .from("parts_catalog")
    .update({ last_purchase_price: poItem.unit_cost, updated_by: userId })
    .eq("id", part.id);

  // Check if all items received → update PO status
  const { data: allItems } = await db
    .from("purchase_order_items")
    .select("quantity_ordered, quantity_received")
    .eq("purchase_order_id", poId);

  const allReceived =
    allItems?.every((i) => i.quantity_received >= i.quantity_ordered) ?? false;

  if (allReceived) {
    await db
      .from("purchase_orders")
      .update({
        status: "received",
        received_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", poId)
      .eq("organization_id", orgId);
  } else {
    await db
      .from("purchase_orders")
      .update({ status: "partial", updated_by: userId })
      .eq("id", poId)
      .eq("organization_id", orgId);
  }

  revalidateTag(cacheTags.purchaseOrders(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");

  return updated as unknown as PurchaseOrderItem;
}
