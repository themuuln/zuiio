import { createClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  CreatePartParams,
  CreateMovementParams,
  CreatePurchaseOrderParams,
  CreateSupplierParams,
  CreateStockThresholdParams,
  InventoryBalance,
  InventoryMovement,
  PartsCatalogItem,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  StockThreshold,
  Supplier,
  UpdatePartParams,
  UpdatePurchaseOrderParams,
  UpdateSupplierParams,
} from "@/lib/types";

// ── Parts Catalog ─────────────────────────────────────────────

export async function getPartsCatalog(orgId: string): Promise<PartsCatalogItem[]> {
  const supabase = await createClient();

  // Fetch parts
  const { data: parts, error } = await supabase
    .from("parts_catalog")
    .select("*")
    .eq("organization_id", orgId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  // Fetch popularity: count how many vehicle models each part is assigned to
  const { data: assignments } = await supabase
    .from("vehicle_model_parts")
    .select("part_id, count")
    .eq("organization_id", orgId);

  const popularityMap: Record<string, number> = {};
  if (assignments) {
    // Group by part_id and count
    const countMap: Record<string, number> = {};
    for (const a of assignments) {
      const pid = a.part_id as string;
      countMap[pid] = (countMap[pid] || 0) + 1;
    }
    // Normalize: 26 models = score 100, proportionally less for fewer
    const maxModels = 26;
    for (const [pid, count] of Object.entries(countMap)) {
      popularityMap[pid] = Math.round((count / maxModels) * 100);
    }
  }

  // Attach popularity score and sort by it descending
  const result = (parts ?? []).map((p) => ({
    ...p,
    popularity_score: popularityMap[p.id] ?? 0,
  }));

  result.sort((a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0));

  return result;
}

export async function getPart(id: string): Promise<PartsCatalogItem> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_catalog")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new NotFoundError("Part not found");
  return data;
}

export async function createPart(
  orgId: string,
  params: CreatePartParams,
  userId: string,
): Promise<PartsCatalogItem> {
  if (!params.name?.trim()) throw new ValidationError("Part name is required");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts_catalog")
    .insert({
      organization_id: orgId,
      name: params.name.trim(),
      name_mn: params.name_mn?.trim() || null,
      part_number: params.part_number?.trim() || null,
      category: params.category?.trim() || null,
      description: params.description?.trim() || null,
      unit: params.unit || "piece",
      default_price: params.default_price ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create part");
  return data;
}

export async function updatePart(
  id: string,
  orgId: string,
  params: UpdatePartParams,
): Promise<PartsCatalogItem> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const updates: Record<string, unknown> = { updated_by: userId };
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.name_mn !== undefined) updates.name_mn = params.name_mn?.trim() || null;
  if (params.part_number !== undefined) updates.part_number = params.part_number || null;
  if (params.category !== undefined) updates.category = params.category || null;
  if (params.description !== undefined) updates.description = params.description || null;
  if (params.unit !== undefined) updates.unit = params.unit;
  if (params.default_price !== undefined) updates.default_price = params.default_price;
  if (params.is_active !== undefined) updates.is_active = params.is_active;

  const { data, error } = await supabase
    .from("parts_catalog")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();
  if (error || !data) throw new NotFoundError("Part not found");
  return data;
}

export async function deletePart(id: string, orgId: string): Promise<void> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error } = await supabase
    .from("parts_catalog")
    .update({ deleted_at: new Date().toISOString(), updated_by: userId })
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new NotFoundError("Part not found");
}

// ── Inventory Balances ────────────────────────────────────────

export async function getInventoryBalances(
  orgId: string,
): Promise<InventoryBalance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_balances")
    .select("*")
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Inventory Movements ───────────────────────────────────────

export async function getInventoryMovements(
  orgId: string,
  type?: string,
  limit = 50,
): Promise<InventoryMovement[]> {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_movements")
    .select("*, part:parts_catalog(name, part_number)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("movement_type", type);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    part_name: ((m.part as { name: string } | null)?.name) ?? "Unknown",
    part: undefined,
  })) as unknown as InventoryMovement[];
}

export async function createMovement(
  orgId: string,
  params: CreateMovementParams,
  userId: string,
): Promise<InventoryMovement> {
  if (!params.part_id) throw new ValidationError("Part is required");
  if (!params.movement_type) throw new ValidationError("Movement type is required");
  if (!params.quantity || params.quantity === 0)
    throw new ValidationError("Quantity must be non-zero");

  const supabase = await createClient();

  // Verify part exists
  const { data: part } = await supabase
    .from("parts_catalog")
    .select("id")
    .eq("id", params.part_id)
    .is("deleted_at", null)
    .single();
  if (!part) throw new NotFoundError("Part not found");

  const { data, error } = await supabase
    .from("inventory_movements")
    .insert({
      organization_id: orgId,
      part_id: params.part_id,
      movement_type: params.movement_type,
      quantity: params.quantity,
      unit_cost: params.unit_cost ?? null,
      unit_price: params.unit_price ?? null,
      reference_type: params.reference_type ?? null,
      reference_id: params.reference_id ?? null,
      notes: params.notes ?? null,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to record movement");
  return data;
}

// ── Suppliers ─────────────────────────────────────────────────

export async function getSupplier(id: string, orgId: string): Promise<Supplier> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new NotFoundError("Supplier not found");
  return data;
}

export async function getSuppliers(orgId: string): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSupplier(
  orgId: string,
  params: CreateSupplierParams,
  userId: string,
): Promise<Supplier> {
  if (!params.name?.trim()) throw new ValidationError("Supplier name is required");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      organization_id: orgId,
      name: params.name.trim(),
      contact_person: params.contact_person?.trim() || null,
      phone: params.phone?.trim() || null,
      email: params.email?.trim() || null,
      address: params.address?.trim() || null,
      tax_id: params.tax_id?.trim() || null,
      payment_terms: params.payment_terms?.trim() || null,
      notes: params.notes?.trim() || null,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create supplier");
  return data;
}

export async function updateSupplier(
  id: string,
  orgId: string,
  params: UpdateSupplierParams,
): Promise<Supplier> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const updates: Record<string, unknown> = { updated_by: userId };
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.contact_person !== undefined) updates.contact_person = params.contact_person || null;
  if (params.phone !== undefined) updates.phone = params.phone || null;
  if (params.email !== undefined) updates.email = params.email || null;
  if (params.address !== undefined) updates.address = params.address || null;
  if (params.tax_id !== undefined) updates.tax_id = params.tax_id || null;
  if (params.payment_terms !== undefined) updates.payment_terms = params.payment_terms || null;
  if (params.notes !== undefined) updates.notes = params.notes || null;
  if (params.is_active !== undefined) updates.is_active = params.is_active;

  const { data, error } = await supabase
    .from("suppliers")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();
  if (error || !data) throw new NotFoundError("Supplier not found");
  return data;
}

export async function deleteSupplier(id: string, orgId: string): Promise<void> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error } = await supabase
    .from("suppliers")
    .update({ deleted_at: new Date().toISOString(), updated_by: userId })
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new NotFoundError("Supplier not found");
}

// ── Purchase Orders ───────────────────────────────────────────

export async function getPurchaseOrders(orgId: string): Promise<PurchaseOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*, supplier:suppliers(name)")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PurchaseOrder[];
}

export async function getPurchaseOrderItems(
  poId: string,
): Promise<(PurchaseOrderItem & { part_name: string })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_order_items")
    .select("*, part:parts_catalog(name)")
    .eq("purchase_order_id", poId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((item: Record<string, unknown>) => ({
    ...item,
    part_name: ((item.part as { name: string } | null)?.name) ?? "Unknown",
  })) as (PurchaseOrderItem & { part_name: string })[];
}

export async function createPurchaseOrder(
  orgId: string,
  params: CreatePurchaseOrderParams,
  userId: string,
): Promise<PurchaseOrder> {
  if (!params.items?.length) throw new ValidationError("At least one item is required");
  if (!params.order_number?.trim()) throw new ValidationError("Order number is required");

  const supabase = await createClient();
  const totalAmount = params.items.reduce(
    (sum, item) => sum + item.unit_cost * item.quantity_ordered,
    0,
  );

  const { data: po, error: poError } = await supabase
    .from("purchase_orders")
    .insert({
      organization_id: orgId,
      supplier_id: params.supplier_id || null,
      order_number: params.order_number.trim(),
      status: "draft",
      notes: params.notes?.trim() || null,
      total_amount: totalAmount,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (poError || !po) throw new Error(poError?.message ?? "Failed to create PO");

  // Insert items
  for (const item of params.items) {
    const { error: itemError } = await supabase
      .from("purchase_order_items")
      .insert({
        organization_id: orgId,
        purchase_order_id: po.id,
        part_id: item.part_id,
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        unit_cost: item.unit_cost,
        notes: item.notes || null,
        created_by: userId,
        updated_by: userId,
      });
    if (itemError) throw new Error(itemError?.message ?? "Failed to add PO item");
  }

  return po;
}

export async function updatePurchaseOrder(
  id: string,
  orgId: string,
  params: UpdatePurchaseOrderParams,
): Promise<PurchaseOrder> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const updates: Record<string, unknown> = { updated_by: userId };
  if (params.status !== undefined) updates.status = params.status;
  if (params.notes !== undefined) updates.notes = params.notes;
  if (params.expected_at !== undefined) updates.expected_at = params.expected_at;
  if (params.received_at !== undefined) updates.received_at = params.received_at;

  const { data, error } = await supabase
    .from("purchase_orders")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();
  if (error || !data) throw new NotFoundError("Purchase order not found");
  return data;
}

export async function receivePurchaseOrder(
  id: string,
  orgId: string,
): Promise<PurchaseOrder> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // Get PO items
  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("*")
    .eq("purchase_order_id", id);

  if (!items?.length) throw new ValidationError("No items to receive");

  // Record movements for each item + update part purchase price
  for (const item of items) {
    const qtyToReceive = item.quantity_ordered - item.quantity_received;
    if (qtyToReceive > 0) {
      const { error: mvError } = await supabase
        .from("inventory_movements")
        .insert({
          organization_id: orgId,
          part_id: item.part_id,
          movement_type: "purchase",
          quantity: qtyToReceive,
          unit_cost: item.unit_cost,
          reference_type: "purchase_order",
          reference_id: id,
          created_by: userId,
        });
      if (mvError) throw new Error(mvError.message);

      // Update received qty
      await supabase
        .from("purchase_order_items")
        .update({
          quantity_received: item.quantity_ordered,
          updated_by: userId,
        })
        .eq("id", item.id);

      // Update part's last_purchase_price from this PO's unit_cost
      await supabase
        .from("parts_catalog")
        .update({
          last_purchase_price: item.unit_cost,
          updated_by: userId,
        })
        .eq("id", item.part_id);
    }
  }

  // Determine new status
  const allReceived = items.every((i) => i.quantity_received >= i.quantity_ordered);
  const newStatus: PurchaseOrderStatus = allReceived ? "received" : "partial";

  const { data, error } = await supabase
    .from("purchase_orders")
    .update({
      status: newStatus,
      received_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error || !data) throw new NotFoundError("Purchase order not found");
  return data;
}

// ── Stock Thresholds ──────────────────────────────────────────

export async function getStockThresholds(orgId: string): Promise<StockThreshold[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_thresholds")
    .select("*")
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setStockThreshold(
  orgId: string,
  params: CreateStockThresholdParams,
): Promise<StockThreshold> {
  if (!params.part_id) throw new ValidationError("Part is required");
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("stock_thresholds")
    .upsert(
      {
        organization_id: orgId,
        part_id: params.part_id,
        minimum_quantity: params.minimum_quantity,
        notes: params.notes || null,
        created_by: userId,
        updated_by: userId,
      },
      { onConflict: "organization_id, branch_id, part_id" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to set threshold");
  return data;
}
