import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import {
  addPartToWorkOrder,
  addServiceToWorkOrder,
} from "@/lib/services/work-order-items-service";
import { recalculateWorkOrderTotals } from "@/lib/services/work-order-service";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";
import type {
  CreateEstimateParams,
  EstimateDetail,
  EstimateStatus,
  UpdateEstimateParams,
} from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────

/**
 * Calculates line total for a single estimate item.
 * Formula: (unit_price * quantity) - discount_amount - (unit_price * quantity * discount_percentage / 100)
 * Clamped to minimum 0.
 */
function calculateLineTotal(item: {
  unit_price: number;
  quantity: number;
  discount_amount: number;
  discount_percentage: number;
}): number {
  const gross = item.unit_price * item.quantity;
  const pctDiscount = gross * (item.discount_percentage / 100);
  const flatDiscount = item.discount_amount;
  return Math.max(gross - pctDiscount - flatDiscount, 0);
}

/**
 * Recalculates all totals on an estimate from its items:
 * subtotal, discount_total, grand_total.
 * Called after any item mutation.
 */
async function recalculateEstimateTotals(
  db: SupabaseClient,
  estimateId: string,
  orgId: string,
): Promise<void> {
  const { data: items } = await db
    .from("estimate_items")
    .select(
      "unit_price, quantity, discount_amount, discount_percentage, line_total",
    )
    .eq("estimate_id", estimateId)
    .eq("organization_id", orgId);

  const { data: estimate } = await db
    .from("estimates")
    .select("discount_amount, discount_percentage, tax_total")
    .eq("id", estimateId)
    .eq("organization_id", orgId)
    .single();

  if (!estimate) return;

  const lineTotals = (items ?? []).reduce(
    (sum, i) => sum + Number(i.line_total),
    0,
  );

  // Estimate-level discounts (in addition to line-level)
  const flatDiscount = Number(estimate.discount_amount ?? 0);
  const pctDiscount =
    lineTotals > 0
      ? lineTotals * (Number(estimate.discount_percentage ?? 0) / 100)
      : 0;
  const discountTotal = flatDiscount + pctDiscount;
  const taxTotal = Number(estimate.tax_total ?? 0);
  const grandTotal = Math.max(lineTotals - discountTotal + taxTotal, 0);

  await db
    .from("estimates")
    .update({
      subtotal: lineTotals,
      discount_total: discountTotal,
      grand_total: grandTotal,
    })
    .eq("id", estimateId)
    .eq("organization_id", orgId);
}

// ── Get Estimates ─────────────────────────────────────────────

/**
 * Fetches estimates for the current org with optional filters.
 * Includes customer, vehicle, and item counts.
 */
export async function getEstimates(
  db: SupabaseClient,
  orgId: string,
  params?: {
    status?: EstimateStatus;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
    branchId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<{ data: EstimateDetail[]; count: number }> {
  const usePagination = typeof params?.page === "number" && params.page > 0;
  const effectivePage = usePagination ? (params.page ?? 1) : 1;
  const effectivePageSize = usePagination ? (params.pageSize ?? 50) : 50;

  let query = db
    .from("estimates")
    .select(
      `
      *,
      customer:customers(first_name, last_name, phone),
      vehicle:vehicles(plate_number, make, model),
      items:estimate_items(id),
      converted_work_order:converted_work_order_id(id, status, total),
      appointment:appointment_id(id, title, scheduled_at)
    `,
      usePagination ? { count: "exact" } : undefined,
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params?.status) query = query.eq("status", params.status);
  if (params?.customer_id) query = query.eq("customer_id", params.customer_id);
  if (params?.branchId) query = withBranchFilter(query, params.branchId);
  if (params?.date_from) query = query.gte("created_at", params.date_from);
  if (params?.date_to) query = query.lte("created_at", params.date_to);
  if (params?.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(
      `estimate_number.ilike.${term},customer.first_name.ilike.${term},customer.last_name.ilike.${term},vehicle.plate_number.ilike.${term}`,
    );
  }

  if (usePagination) {
    const from = (effectivePage - 1) * effectivePageSize;
    const to = from + effectivePageSize - 1;
    query = query.range(from, to);
  } else {
    query = query.limit(50);
  }

  const { data, count } = await query;
  return {
    data: (data ?? []) as unknown as EstimateDetail[],
    count: count ?? 0,
  };
}

// ── Get Single Estimate ───────────────────────────────────────

/**
 * Fetches a single estimate by ID with all relations.
 */
export async function getEstimate(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<EstimateDetail | null> {
  const { data } = await db
    .from("estimates")
    .select(
      `
      *,
      customer:customers(*),
      vehicle:vehicles(*),
      items:estimate_items(*),
      converted_work_order:converted_work_order_id(id, status, total),
      appointment:appointment_id(id, title, scheduled_at)
    `,
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  return data as unknown as EstimateDetail | null;
}

// ── Create Estimate ───────────────────────────────────────────

/**
 * Creates a new estimate with items and auto-calculated totals.
 * Generates a human-readable estimate number automatically.
 *
 * @param db - Supabase client from route handler
 * @param orgId - Organization ID from the route handler
 * @param params - Estimate data including items
 * @returns The full EstimateDetail
 */
export async function createEstimate(
  db: SupabaseClient,
  orgId: string,
  params: CreateEstimateParams,
): Promise<EstimateDetail> {
  if (!params.customer_id) throw new ValidationError("Customer is required");
  if (!params.vehicle_id) throw new ValidationError("Vehicle is required");
  if (!params.items?.length)
    throw new ValidationError("At least one item is required");

  const user = (await db.auth.getUser()).data.user;
  if (!user) throw new UnauthorizedError();

  // Generate estimate number
  const { data: estNum } = await db.rpc("generate_estimate_number");
  const estimateNumber = (estNum as string) ?? `EST-${Date.now()}`;

  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });

  // Create the estimate
  const { data: estimate, error } = await db
    .from("estimates")
    .insert({
      organization_id: orgId,
      branch_id: resolvedBranchId,
      customer_id: params.customer_id,
      vehicle_id: params.vehicle_id,
      estimate_number: estimateNumber,
      status: params.status ?? "draft",
      notes: params.notes?.trim() ?? null,
      terms: params.terms?.trim() ?? null,
      valid_until: params.valid_until ?? null,
      discount_amount: params.discount_amount ?? 0,
      discount_percentage: params.discount_percentage ?? 0,
      tax_total: params.tax_total ?? 0,
      appointment_id: params.appointment_id ?? null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error || !estimate) {
    throw new Error(error?.message ?? "Failed to create estimate");
  }

  // Insert items
  const itemsToInsert = params.items.map((item, i) => ({
    estimate_id: estimate.id,
    organization_id: orgId,
    item_type: item.item_type,
    source_service_id: item.source_service_id ?? null,
    source_part_id: item.source_part_id ?? null,
    description: item.description,
    quantity: item.quantity ?? 1,
    unit_price: item.unit_price,
    unit_cost: 0,
    discount_amount: item.discount_amount ?? 0,
    discount_percentage: item.discount_percentage ?? 0,
    line_total: calculateLineTotal({
      unit_price: item.unit_price,
      quantity: item.quantity ?? 1,
      discount_amount: item.discount_amount ?? 0,
      discount_percentage: item.discount_percentage ?? 0,
    }),
    sort_order: item.sort_order ?? i,
    notes: item.notes ?? null,
    created_by: user.id,
  }));

  const { error: itemsError } = await db
    .from("estimate_items")
    .insert(itemsToInsert);

  if (itemsError) {
    // Clean up the estimate if items failed
    await db.from("estimates").delete().eq("id", estimate.id);
    throw new Error(itemsError.message ?? "Failed to create estimate items");
  }

  // Recalculate totals
  await recalculateEstimateTotals(db, estimate.id, orgId);

  await createAuditLog({
    supabase: db,
    action: "create",
    table_name: "estimates",
    record_id: estimate.id,
    user_id: user.id,
    organization_id: orgId,
    new_data: {
      estimate_number: estimateNumber,
      status: params.status ?? "draft",
      customer_id: params.customer_id,
      vehicle_id: params.vehicle_id,
    },
  });

  revalidateTag(cacheTags.estimates(orgId), "max");

  const created = await getEstimate(db, estimate.id, orgId);
  if (!created) throw new Error("Failed to fetch created estimate");
  return created;
}

// ── Update Estimate ───────────────────────────────────────────

/**
 * Updates an estimate's header fields and optionally replaces items.
 * If `items` is provided, existing items are deleted and replaced.
 * Totals are always recalculated.
 */
export async function updateEstimate(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateEstimateParams,
): Promise<EstimateDetail> {
  const user = (await db.auth.getUser()).data.user;

  const { data: oldEstimate } = await db
    .from("estimates")
    .select(
      "id, status, notes, terms, discount_amount, discount_percentage, tax_total",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  const updates: Record<string, unknown> = {
    updated_by: user?.id ?? null,
  };

  if (params.notes !== undefined) updates.notes = params.notes?.trim() ?? null;
  if (params.terms !== undefined) updates.terms = params.terms?.trim() ?? null;
  if (params.valid_until !== undefined)
    updates.valid_until = params.valid_until;
  if (params.status !== undefined) updates.status = params.status;
  if (params.discount_amount !== undefined)
    updates.discount_amount = params.discount_amount;
  if (params.discount_percentage !== undefined)
    updates.discount_percentage = params.discount_percentage;
  if (params.tax_total !== undefined) updates.tax_total = params.tax_total;

  const { error } = await db
    .from("estimates")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Estimate not found");

  await createAuditLog({
    supabase: db,
    action: "update",
    table_name: "estimates",
    record_id: id,
    user_id: user?.id ?? undefined,
    organization_id: orgId,
    old_data: oldEstimate ?? undefined,
    new_data: updates,
  });

  // If items are provided, replace all items
  if (params.items) {
    // Delete existing items
    await db.from("estimate_items").delete().eq("estimate_id", id);

    // Insert new items
    const itemsToInsert = params.items.map((item, i) => ({
      estimate_id: id,
      organization_id: orgId,
      item_type: item.item_type,
      source_service_id: item.source_service_id ?? null,
      source_part_id: item.source_part_id ?? null,
      description: item.description,
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price,
      unit_cost: 0,
      discount_amount: item.discount_amount ?? 0,
      discount_percentage: item.discount_percentage ?? 0,
      line_total: calculateLineTotal({
        unit_price: item.unit_price,
        quantity: item.quantity ?? 1,
        discount_amount: item.discount_amount ?? 0,
        discount_percentage: item.discount_percentage ?? 0,
      }),
      sort_order: item.sort_order ?? i,
      notes: item.notes ?? null,
      created_by: user?.id ?? null,
    }));

    const { error: itemsError } = await db
      .from("estimate_items")
      .insert(itemsToInsert);

    if (itemsError)
      throw new Error(itemsError.message ?? "Failed to update estimate items");
  }

  await recalculateEstimateTotals(db, id, orgId);

  revalidateTag(cacheTags.estimates(orgId), "max");
  revalidateTag(cacheTags.estimate(id), "max");

  const updated = await getEstimate(db, id, orgId);
  if (!updated) throw new NotFoundError("Estimate not found");
  return updated;
}

// ── Update Estimate Status ────────────────────────────────────

/**
 * Updates just the status of an estimate.
 */
export async function updateEstimateStatus(
  db: SupabaseClient,
  id: string,
  orgId: string,
  status: EstimateStatus,
): Promise<EstimateDetail> {
  return updateEstimate(db, id, orgId, { status });
}

// ── Delete Estimate ───────────────────────────────────────────

/**
 * Soft-deletes an estimate.
 */
export async function deleteEstimate(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const { error } = await db
    .from("estimates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Estimate not found");

  revalidateTag(cacheTags.estimates(orgId), "max");
}

// ── Convert Estimate to Work Order ────────────────────────────

/**
 * Converts an approved estimate into a work order.
 * 1. Validates the estimate is in "approved" status
 * 2. Creates a work order from estimate data (customer, vehicle)
 * 3. Adds all estimate items as work_order_services or work_order_parts
 * 4. Copies estimate-level discounts to the work order
 * 5. Marks the estimate as "converted" and stores converted_work_order_id
 * 6. Returns the new WorkOrderDetail
 *
 * The work order appears in Bay View and follows the normal WO lifecycle.
 */
export async function convertEstimateToWorkOrder(
  db: SupabaseClient,
  estimateId: string,
  orgId: string,
): Promise<import("@/lib/types").WorkOrderDetail> {
  const user = (await db.auth.getUser()).data.user;
  if (!user) throw new UnauthorizedError();

  // Fetch the estimate with items
  const estimate = await getEstimate(db, estimateId, orgId);
  if (!estimate) throw new NotFoundError("Estimate not found");

  const oldEstimateData = {
    id: estimate.id,
    status: estimate.status,
    estimate_number: estimate.estimate_number,
    customer_id: estimate.customer_id,
    vehicle_id: estimate.vehicle_id,
  };

  if (estimate.status !== "approved") {
    throw new ValidationError(
      `Cannot convert estimate with status "${estimate.status}". Only "approved" estimates can be converted.`,
    );
  }
  if (estimate.converted_work_order_id) {
    throw new ValidationError(
      "This estimate has already been converted to a work order",
    );
  }

  // Get a branch for the work order
  const resolvedBranchId = await resolveBranchId(db, orgId, undefined, {
    strict: false,
  });

  // Create the work order
  const { data: wo, error: woError } = await db
    .from("work_orders")
    .insert({
      organization_id: orgId,
      branch_id: resolvedBranchId,
      customer_id: estimate.customer_id,
      vehicle_id: estimate.vehicle_id,
      source_estimate_id: estimate.id,
      status: "New",
      notes: estimate.notes,
      discount_amount: estimate.discount_amount,
      discount_percentage: estimate.discount_percentage,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (woError || !wo)
    throw new Error(woError?.message ?? "Failed to create work order");

  // Record initial status
  await db.from("work_order_status_history").insert({
    work_order_id: wo.id,
    organization_id: orgId,
    status: "New",
    notes: `Created from estimate #${estimate.estimate_number}`,
    created_by: user.id,
  });

  // Add each estimate item as a service or part on the work order
  for (const item of estimate.items) {
    if (item.item_type === "service" || item.item_type === "custom") {
      await addServiceToWorkOrder(db, wo.id, orgId, {
        service_catalog_id:
          item.source_service_id ?? "00000000-0000-0000-0000-000000000000",
        service_name: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        discount_percentage: item.discount_percentage,
        notes: item.notes ?? undefined,
      });
    } else if (item.item_type === "part") {
      await addPartToWorkOrder(db, wo.id, orgId, {
        part_id: item.source_part_id ?? undefined,
        part_name: item.description,
        part_number: undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        discount_percentage: item.discount_percentage,
        notes: item.notes ?? undefined,
      });
    }
  }

  // Recalculate totals
  await recalculateWorkOrderTotals(db, wo.id);

  // Mark estimate as converted
  await db
    .from("estimates")
    .update({
      status: "converted",
      converted_work_order_id: wo.id,
      updated_by: user.id,
    })
    .eq("id", estimateId)
    .eq("organization_id", orgId);

  await createAuditLog({
    supabase: db,
    action: "update",
    table_name: "estimates",
    record_id: estimateId,
    user_id: user.id,
    organization_id: orgId,
    old_data: oldEstimateData,
    new_data: { status: "converted", converted_work_order_id: wo.id },
  });

  // Revalidate caches
  revalidateTag(cacheTags.estimates(orgId), "max");
  revalidateTag(cacheTags.estimate(estimateId), "max");
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.bayView(orgId, orgId), "max");

  // Return the work order detail
  const { getWorkOrder } = await import("@/lib/services/work-order-service");
  return getWorkOrder(db, wo.id);
}
