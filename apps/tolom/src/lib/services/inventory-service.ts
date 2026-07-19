import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { withDbCapture } from "@/lib/supabase/query";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";
import type {
  CreateMovementParams,
  CreatePartParams,
  CreateStockThresholdParams,
  InventoryBalance,
  InventoryBalanceWithAvgCost,
  InventoryMovement,
  PaginatedResponse,
  PartsCatalogItem,
  StockThreshold,
  UpdatePartParams,
} from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

const partFieldMap: FieldMap<UpdatePartParams> = {
  columns: {
    name: "name",
    name_mn: "name_mn",
    part_number: "part_number",
    barcode: "barcode",
    category: "category",
    description: "description",
    unit: "unit",
    default_price: "default_price",
    image_url: "image_url",
    location: "location",
    is_active: "is_active",
    global_part_id: "global_part_id",
  },
  transforms: {
    name: trimField,
    name_mn: trimField,
    part_number: (v) => (v as string) || null,
    barcode: (v) => (v as string) || null,
    category: (v) => (v as string) || null,
    description: (v) => (v as string) || null,
    image_url: (v) => (v as string) || null,
    location: (v) => (v as string) || null,
    global_part_id: (v) => (v as string) || null,
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
      "id, organization_id, name, name_mn, part_number, category, unit, default_price, is_active, purchase_price, image_url, location, created_at, deleted_at, global_part_id",
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
    .select("part_id")
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
  orgId: string,
): Promise<PartsCatalogItem> {
  const supabase = db;
  const { data, error } = await supabase
    .from("parts_catalog")
    .select(
      "id, organization_id, name, name_mn, part_number, category, description, unit, default_price, purchase_price, image_url, location, last_purchase_price, is_active, created_at, updated_at, created_by, updated_by, global_part_id",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
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
      location: params.location?.trim() || null,
      global_part_id: params.global_part_id || null,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, name, name_mn, part_number, category, description, unit, default_price, purchase_price, image_url, location, is_active, created_at, updated_at, created_by, updated_by, global_part_id",
    )
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "Failed to create part");
  logAuditAfter({
    supabase: db,
    action: "create",
    table_name: "parts_catalog",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data,
  });
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

  const { data: existingRecord } = await supabase
    .from("parts_catalog")
    .select(
      "id, name, name_mn, part_number, category, description, unit, default_price, image_url, location, is_active, global_part_id",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  const updates = buildUpdates(params, partFieldMap);
  updates.updated_by = userId;

  const { data, error } = await supabase
    .from("parts_catalog")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, name, name_mn, part_number, category, description, unit, default_price, purchase_price, image_url, location, last_purchase_price, is_active, created_at, updated_at, created_by, updated_by, global_part_id",
    )
    .single();
  if (error || !data) throw new NotFoundError("Part not found");
  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: "parts_catalog",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
    old_data: existingRecord as Record<string, unknown> | undefined,
    new_data: data,
  });
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

/**
 * Fast inventory balance list using the get_inventory_with_stock RPC function.
 * Single DB call replaces balances + thresholds joins for unscoped inventory views.
 */
export async function getInventoryFast(
  db: SupabaseClient,
  orgId: string,
  options?: { search?: string; lowStockOnly?: boolean; limit?: number },
): Promise<InventoryBalanceWithAvgCost[]> {
  const { data, error } = await withDbCapture(
    "getInventoryFast",
    db.rpc("get_inventory_with_stock", {
      p_org_id: orgId,
      p_search: options?.search ?? null,
      p_low_stock_only: options?.lowStockOnly ?? false,
      p_limit: options?.limit ?? 50,
      p_offset: 0,
    }),
  );

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    part_id: string | null;
    part_name: string | null;
    part_number: string | null;
    category: string | null;
    unit: string | null;
    default_price: number | null;
    quantity_on_hand: number | null;
    last_movement_at: string | null;
    min_threshold: number | null;
    max_threshold: number | null;
    stock_status: string | null;
  }>;

  return rows.map((row) => ({
    organization_id: orgId,
    branch_id: null,
    part_id: row.part_id,
    part_name: row.part_name,
    part_number: row.part_number,
    category: row.category,
    unit: row.unit,
    default_price: row.default_price,
    quantity_on_hand: row.quantity_on_hand,
    last_movement_at: row.last_movement_at,
    avg_unit_cost: row.default_price ?? 0, // NOTE: RPC returns stock status, not weighted avg cost. Use getInventoryBalances for weighted avg.
    min_threshold: row.min_threshold ?? 0,
    max_threshold: row.max_threshold ?? 0,
    stock_status: row.stock_status ?? "in_stock",
  })) as unknown as InventoryBalanceWithAvgCost[];
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
  logAuditAfter({
    supabase: db,
    action: "create",
    table_name: "inventory_movements",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data,
  });
  revalidateTag(cacheTags.inventoryMovements(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  return data;
}

// ── Re-exports for backward compatibility ──────────────────────

export {
  createPurchaseOrder,
  getPurchaseOrderItems,
  getPurchaseOrders,
  receivePurchaseOrder,
  updatePurchaseOrder,
} from "./purchase-order-service";
export {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from "./supplier-service";

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
