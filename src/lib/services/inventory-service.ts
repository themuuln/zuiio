import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";
import type {
  CreateMovementParams,
  CreatePartParams,
  CreatePurchaseOrderParams,
  CreateStockThresholdParams,
  CreateSupplierParams,
  InventoryBalance,
  InventoryMovement,
  PaginatedResponse,
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
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

const partFieldMap: FieldMap<UpdatePartParams> = {
  columns: {
    name: "name",
    name_mn: "name_mn",
    part_number: "part_number",
    category: "category",
    description: "description",
    unit: "unit",
    default_price: "default_price",
    image_url: "image_url",
    is_active: "is_active",
    global_part_id: "global_part_id",
  },
  transforms: {
    name: trimField,
    name_mn: trimField,
    part_number: (v) => (v as string) || null,
    category: (v) => (v as string) || null,
    description: (v) => (v as string) || null,
    image_url: (v) => (v as string) || null,
    global_part_id: (v) => (v as string) || null,
  },
};

const supplierFieldMap: FieldMap<UpdateSupplierParams> = {
  columns: {
    name: "name",
    contact_person: "contact_person",
    phone: "phone",
    email: "email",
    address: "address",
    tax_id: "tax_id",
    payment_terms: "payment_terms",
    notes: "notes",
    is_active: "is_active",
  },
  transforms: {
    name: trimField,
    contact_person: (v) => (v as string) || null,
    phone: (v) => (v as string) || null,
    email: (v) => (v as string) || null,
    address: (v) => (v as string) || null,
    tax_id: (v) => (v as string) || null,
    payment_terms: (v) => (v as string) || null,
    notes: (v) => (v as string) || null,
  },
};

const purchaseOrderFieldMap: FieldMap<UpdatePurchaseOrderParams> = {
  columns: {
    status: "status",
    notes: "notes",
    expected_at: "expected_at",
    received_at: "received_at",
  },
};

// ── Parts Catalog ─────────────────────────────────────────────

export async function getPartsCatalog(
  db: SupabaseClient,
  orgId: string,
  page?: number,
  pageSize?: number,
  limit = 50,
): Promise<PartsCatalogItem[] | PaginatedResponse<PartsCatalogItem>> {
  const supabase = db;
  const usePagination = typeof page === "number" && page > 0;
  const effectivePage = usePagination ? page : 1;
  const effectivePageSize = usePagination ? (pageSize ?? 50) : limit;

  let query = supabase
    .from("parts_catalog")
    .select(
      "id, organization_id, name, name_mn, part_number, category, unit, default_price, is_active, purchase_price, image_url, created_at, deleted_at, global_part_id",
      usePagination ? { count: "exact" } : undefined,
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (usePagination) {
    const from = (effectivePage - 1) * effectivePageSize;
    const to = from + effectivePageSize - 1;
    query = query.range(from, to);
  } else {
    query = query.limit(limit + 1);
  }

  const { data: parts, error, count } = await query;
  if (error) throw new Error(error.message);

  const { data: assignments } = await supabase
    .from("vehicle_model_parts")
    .select("part_id, count")
    .eq("organization_id", orgId);

  const popularityMap: Record<string, number> = {};
  if (assignments) {
    const countMap: Record<string, number> = {};
    for (const a of assignments) {
      const pid = a.part_id as string;
      countMap[pid] = (countMap[pid] || 0) + 1;
    }
    const maxModels = 26;
    for (const [pid, count] of Object.entries(countMap)) {
      popularityMap[pid] = Math.round((count / maxModels) * 100);
    }
  }

  const result = (parts ?? []).map((p) => ({
    ...p,
    popularity_score: popularityMap[p.id] ?? 0,
  }));

  result.sort((a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0));

  if (usePagination) {
    return {
      data: result,
      total: count ?? 0,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages: Math.ceil((count ?? 0) / effectivePageSize),
    } as unknown as PaginatedResponse<PartsCatalogItem>;
  }

  return result as unknown as PartsCatalogItem[];
}

export async function getPart(
  db: SupabaseClient,
  id: string,
): Promise<PartsCatalogItem> {
  const supabase = db;
  const { data, error } = await supabase
    .from("parts_catalog")
    .select(
      "id, organization_id, name, name_mn, part_number, category, description, unit, default_price, purchase_price, image_url, last_purchase_price, is_active, created_at, updated_at, created_by, updated_by, global_part_id",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new NotFoundError("Part not found");
  return data;
}

export async function createPart(
  db: SupabaseClient,
  orgId: string,
  params: CreatePartParams,
  userId: string,
): Promise<PartsCatalogItem> {
  if (!params.name_mn?.trim())
    throw new ValidationError("Монгол нэр шаардлагатай");
  const supabase = db;
  const nameEn = params.name?.trim() || params.name_mn.trim();
  const { data, error } = await supabase
    .from("parts_catalog")
    .insert({
      organization_id: orgId,
      name: nameEn,
      name_mn: params.name_mn?.trim() || null,
      part_number: params.part_number?.trim() || null,
      category: params.category?.trim() || null,
      description: params.description?.trim() || null,
      unit: params.unit || "piece",
      default_price: params.default_price ?? null,
      image_url: params.image_url ?? null,
      global_part_id: params.global_part_id || null,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, name, name_mn, part_number, category, description, unit, default_price, purchase_price, image_url, is_active, created_at, updated_at, created_by, updated_by, global_part_id",
    )
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "Failed to create part");
  revalidateTag(cacheTags.partsCatalog(orgId), "max");
  return data;
}

export async function updatePart(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdatePartParams,
): Promise<PartsCatalogItem> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const updates = buildUpdates(params, partFieldMap);
  updates.updated_by = userId;

  const { data, error } = await supabase
    .from("parts_catalog")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, name, name_mn, part_number, category, description, unit, default_price, purchase_price, image_url, last_purchase_price, is_active, created_at, updated_at, created_by, updated_by, global_part_id",
    )
    .single();
  if (error || !data) throw new NotFoundError("Part not found");
  revalidateTag(cacheTags.partsCatalog(orgId), "max");
  return data;
}

export async function deletePart(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error } = await supabase
    .from("parts_catalog")
    .update({ deleted_at: new Date().toISOString(), updated_by: userId })
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new NotFoundError("Part not found");
  revalidateTag(cacheTags.partsCatalog(orgId), "max");
}

// ── Part Categories ───────────────────────────────────────────

export async function getPartCategories(
  db: SupabaseClient,
  orgId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from("part_categories")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPartCategory(
  db: SupabaseClient,
  orgId: string,
  name: string,
  userId: string,
): Promise<{ id: string; name: string }> {
  const supabase = db;
  const { data, error } = await supabase
    .from("part_categories")
    .insert({ organization_id: orgId, name: name.trim(), created_by: userId })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);
  revalidateTag(cacheTags.partsCatalog(orgId), "max");
  return data;
}

// ── Inventory Balances ────────────────────────────────────────

export async function getInventoryBalances(
  db: SupabaseClient,
  orgId: string,
  branchId?: string | null,
): Promise<InventoryBalance[]> {
  const supabase = db;
  let query = supabase
    .from("inventory_balances")
    .select(
      "part_id, part_name, part_number, category, unit, default_price, quantity_on_hand, last_movement_at, organization_id, branch_id",
    )
    .eq("organization_id", orgId);
  if (branchId) query = withBranchFilter(query, branchId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Weighted Average Cost ─────────────────────────────────────

export async function getWeightedAverageCosts(
  db: SupabaseClient,
  orgId: string,
  branchId?: string | null,
): Promise<Record<string, number>> {
  const supabase = db;
  let query = supabase
    .from("inventory_movements")
    .select("part_id, quantity, unit_cost")
    .eq("organization_id", orgId)
    .eq("movement_type", "purchase")
    .not("unit_cost", "is", null);
  if (branchId) query = withBranchFilter(query, branchId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Compute weighted avg: SUM(quantity * unit_cost) / SUM(quantity)
  const acc: Record<string, { totalQty: number; totalCost: number }> = {};
  for (const m of data ?? []) {
    const pid = m.part_id;
    if (!acc[pid]) acc[pid] = { totalQty: 0, totalCost: 0 };
    acc[pid].totalQty += m.quantity;
    acc[pid].totalCost += m.quantity * (m.unit_cost ?? 0);
  }

  const result: Record<string, number> = {};
  for (const [pid, a] of Object.entries(acc)) {
    result[pid] = a.totalQty > 0 ? a.totalCost / a.totalQty : 0;
  }
  return result;
}

// ── Inventory Movements ───────────────────────────────────────

export async function getInventoryMovements(
  db: SupabaseClient,
  orgId: string,
  type?: string,
  limit = 50,
  page?: number,
  pageSize?: number,
  branchId?: string | null,
): Promise<InventoryMovement[] | PaginatedResponse<InventoryMovement>> {
  const supabase = db;
  const usePagination = typeof page === "number" && page > 0;
  const effectivePage = usePagination ? page : 1;
  const effectivePageSize = usePagination ? (pageSize ?? 50) : limit;

  let query = supabase
    .from("inventory_movements")
    .select(
      "*, part:parts_catalog(name, part_number)",
      usePagination ? { count: "exact" } : undefined,
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (usePagination) {
    const from = (effectivePage - 1) * effectivePageSize;
    const to = from + effectivePageSize - 1;
    query = query.range(from, to);
  } else {
    query = query.limit(limit);
  }

  if (type) query = query.eq("movement_type", type);
  if (branchId) query = withBranchFilter(query, branchId);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const mapped = (data ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    part_name: (m.part as { name: string } | null)?.name ?? "Unknown",
    part: undefined,
  })) as unknown as InventoryMovement[];

  if (usePagination) {
    return {
      data: mapped,
      total: count ?? 0,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages: Math.ceil((count ?? 0) / effectivePageSize),
    } as unknown as PaginatedResponse<InventoryMovement>;
  }

  return mapped;
}

export async function createMovement(
  db: SupabaseClient,
  orgId: string,
  params: CreateMovementParams,
  userId: string,
): Promise<InventoryMovement> {
  if (!params.part_id) throw new ValidationError("Part is required");
  if (!params.movement_type)
    throw new ValidationError("Movement type is required");
  if (!params.quantity || params.quantity === 0)
    throw new ValidationError("Quantity must be non-zero");

  const supabase = db;

  // Verify part exists
  const { data: part } = await supabase
    .from("parts_catalog")
    .select("id")
    .eq("id", params.part_id)
    .is("deleted_at", null)
    .single();
  if (!part) throw new NotFoundError("Part not found");

  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });

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
      branch_id: resolvedBranchId,
      created_by: userId,
    })
    .select(
      "id, organization_id, part_id, movement_type, quantity, unit_cost, unit_price, reference_type, reference_id, notes, created_at, created_by, branch_id",
    )
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "Failed to record movement");
  revalidateTag(cacheTags.inventoryMovements(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  return data;
}

// ── Suppliers ─────────────────────────────────────────────────

export async function getSupplier(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<Supplier> {
  const supabase = db;
  const { data, error } = await supabase
    .from("suppliers")
    .select(
      "id, organization_id, name, contact_person, phone, email, address, tax_id, payment_terms, notes, is_active, created_at, updated_at, created_by, updated_by",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new NotFoundError("Supplier not found");
  return data as unknown as Supplier;
}

export async function getSuppliers(
  db: SupabaseClient,
  orgId: string,
  page?: number,
  pageSize?: number,
): Promise<PaginatedResponse<Supplier>> {
  const supabase = db;
  const effectivePage = Math.max(1, page ?? 1);
  const effectivePageSize = Math.min(100, Math.max(1, pageSize ?? 50));
  const from = (effectivePage - 1) * effectivePageSize;
  const to = from + effectivePageSize - 1;

  const { data, error, count } = await supabase
    .from("suppliers")
    .select("*", { count: "exact" })
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("name")
    .range(from, to);
  if (error) throw new Error(error.message);
  return {
    data: data ?? [],
    total: count ?? 0,
    page: effectivePage,
    pageSize: effectivePageSize,
    totalPages: Math.ceil((count ?? 0) / effectivePageSize),
  } as unknown as PaginatedResponse<Supplier>;
}

export async function createSupplier(
  db: SupabaseClient,
  orgId: string,
  params: CreateSupplierParams,
  userId: string,
): Promise<Supplier> {
  if (!params.name?.trim())
    throw new ValidationError("Supplier name is required");
  const supabase = db;
  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      organization_id: orgId,
      name: params.name.trim(),
      branch_id: resolvedBranchId,
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
    .select(
      "id, organization_id, name, contact_person, phone, email, address, tax_id, payment_terms, notes, is_active, created_at, updated_at, created_by, updated_by",
    )
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "Failed to create supplier");
  revalidateTag(cacheTags.suppliers(orgId), "max");
  return data as unknown as Supplier;
}

export async function updateSupplier(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateSupplierParams,
): Promise<Supplier> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const updates = buildUpdates(params, supplierFieldMap);
  updates.updated_by = userId;

  const { data, error } = await supabase
    .from("suppliers")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, name, contact_person, phone, email, address, tax_id, payment_terms, notes, is_active, created_at, updated_at, created_by, updated_by",
    )
    .single();
  if (error || !data) throw new NotFoundError("Supplier not found");
  revalidateTag(cacheTags.suppliers(orgId), "max");
  return data as unknown as Supplier;
}

export async function deleteSupplier(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error } = await supabase
    .from("suppliers")
    .update({ deleted_at: new Date().toISOString(), updated_by: userId })
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new NotFoundError("Supplier not found");
  revalidateTag(cacheTags.suppliers(orgId), "max");
}

// ── Purchase Orders ───────────────────────────────────────────

export async function getPurchaseOrders(
  db: SupabaseClient,
  orgId: string,
  page?: number,
  pageSize?: number,
  branchId?: string | null,
): Promise<PaginatedResponse<PurchaseOrder>> {
  const supabase = db;
  const effectivePage = Math.max(1, page ?? 1);
  const effectivePageSize = Math.min(100, Math.max(1, pageSize ?? 50));
  const from = (effectivePage - 1) * effectivePageSize;
  const to = from + effectivePageSize - 1;

  let query = supabase
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

export async function getPurchaseOrderItems(
  db: SupabaseClient,
  poId: string,
): Promise<(PurchaseOrderItem & { part_name: string })[]> {
  const supabase = db;
  const { data, error } = await supabase
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

  const supabase = db;
  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });

  const totalAmount = params.items.reduce(
    (sum, item) => sum + item.unit_cost * item.quantity_ordered,
    0,
  );

  const { data: po, error: poError } = await supabase
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

  const { error: itemsError } = await supabase
    .from("purchase_order_items")
    .insert(items);

  if (itemsError)
    throw new Error(itemsError?.message ?? "Failed to add PO item");

  revalidateTag(cacheTags.purchaseOrders(orgId), "max");
  return po as unknown as PurchaseOrder;
}

export async function updatePurchaseOrder(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdatePurchaseOrderParams,
): Promise<PurchaseOrder> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const updates = buildUpdates(params, purchaseOrderFieldMap);
  updates.updated_by = userId;

  const { data, error } = await supabase
    .from("purchase_orders")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, supplier_id, order_number, order_date, status, total_amount, notes, expected_at, received_at, created_at, updated_at, created_by, updated_by",
    )
    .single();
  if (error || !data) throw new NotFoundError("Purchase order not found");
  revalidateTag(cacheTags.purchaseOrders(orgId), "max");
  return data as unknown as PurchaseOrder;
}

export async function receivePurchaseOrder(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<PurchaseOrder> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // Get PO items
  const { data: items } = await supabase
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

    const { error: mvError } = await supabase
      .from("inventory_movements")
      .insert(movements);
    if (mvError) throw new Error(mvError.message);

    await Promise.all(
      itemsToReceive.map(async (item) => {
        await supabase
          .from("purchase_order_items")
          .update({
            quantity_received: item.quantity_ordered,
            updated_by: userId,
          })
          .eq("id", item.id);

        await supabase
          .from("parts_catalog")
          .update({
            last_purchase_price: item.unit_cost,
            updated_by: userId,
          })
          .eq("id", item.part_id);
      }),
    );
  }

  // Determine new status
  const allReceived = items.every(
    (i) => i.quantity_received >= i.quantity_ordered,
  );
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
    .select(
      "id, organization_id, supplier_id, order_number, order_date, status, total_amount, notes, expected_at, received_at, created_at, updated_at, created_by, updated_by",
    )
    .single();

  if (error || !data) throw new NotFoundError("Purchase order not found");
  revalidateTag(cacheTags.purchaseOrders(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  return data as unknown as PurchaseOrder;
}

// ── Stock Thresholds ──────────────────────────────────────────

export async function getStockThresholds(
  db: SupabaseClient,
  orgId: string,
  branchId?: string | null,
): Promise<StockThreshold[]> {
  const supabase = db;
  let query = supabase
    .from("stock_thresholds")
    .select(
      "id, organization_id, branch_id, part_id, minimum_quantity, maximum_quantity, notes, created_at, updated_at",
    )
    .eq("organization_id", orgId);
  if (branchId) query = withBranchFilter(query, branchId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as StockThreshold[];
}

export async function setStockThreshold(
  db: SupabaseClient,
  orgId: string,
  params: CreateStockThresholdParams,
): Promise<StockThreshold> {
  if (!params.part_id) throw new ValidationError("Part is required");
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });

  const { data, error } = await supabase
    .from("stock_thresholds")
    .upsert(
      {
        organization_id: orgId,
        part_id: params.part_id,
        branch_id: resolvedBranchId,
        minimum_quantity: params.minimum_quantity,
        notes: params.notes || null,
        created_by: userId,
        updated_by: userId,
      },
      { onConflict: "organization_id, branch_id, part_id" },
    )
    .select(
      "id, organization_id, branch_id, part_id, minimum_quantity, maximum_quantity, notes, created_at, updated_at, created_by, updated_by",
    )
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "Failed to set threshold");
  revalidateTag(cacheTags.stockThresholds(orgId), "max");
  return data;
}
