import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateEstimateParams,
  EstimateDetail,
  EstimateStatus,
  UpdateEstimateParams,
} from "@/lib/types";
import {
  addPartToWorkOrder,
  addServiceToWorkOrder,
  recalculateWorkOrderTotals,
} from "@/lib/services/work-order-service";

// ── Helpers ────────────────────────────────────────────────────

async function getOrgId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  const { data } = await supabase.rpc("get_user_organization_id");
  if (!data) throw new UnauthorizedError("Choose an organization to continue");
  return data;
}

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
async function recalculateEstimateTotals(estimateId: string): Promise<void> {
  const supabase = await createClient();
  const orgId = await getOrgId();

  const { data: items } = await supabase
    .from("estimate_items")
    .select(
      "unit_price, quantity, discount_amount, discount_percentage, line_total",
    )
    .eq("estimate_id", estimateId)
    .eq("organization_id", orgId);

  const { data: estimate } = await supabase
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

  await supabase
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
export async function getEstimates(params?: {
  status?: EstimateStatus;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<EstimateDetail[]> {
  const supabase = await createClient();
  const orgId = await getOrgId();

  let query = supabase
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
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params?.status) query = query.eq("status", params.status);
  if (params?.customer_id) query = query.eq("customer_id", params.customer_id);
  if (params?.date_from) query = query.gte("created_at", params.date_from);
  if (params?.date_to) query = query.lte("created_at", params.date_to);

  const { data } = await query;
  return (data ?? []) as unknown as EstimateDetail[];
}

// ── Get Single Estimate ───────────────────────────────────────

/**
 * Fetches a single estimate by ID with all relations.
 */
export async function getEstimate(id: string): Promise<EstimateDetail | null> {
  const supabase = await createClient();
  const orgId = await getOrgId();

  const { data } = await supabase
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
 * @param orgId - Organization ID from the route handler
 * @param params - Estimate data including items
 * @returns The full EstimateDetail
 */
export async function createEstimate(
  orgId: string,
  params: CreateEstimateParams,
): Promise<EstimateDetail> {
  if (!params.customer_id) throw new ValidationError("Customer is required");
  if (!params.vehicle_id) throw new ValidationError("Vehicle is required");
  if (!params.items?.length)
    throw new ValidationError("At least one item is required");

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new UnauthorizedError();

  // Generate estimate number
  const { data: estNum } = await supabase.rpc("generate_estimate_number");
  const estimateNumber = (estNum as string) ?? `EST-${Date.now()}`;

  // Create the estimate
  const { data: estimate, error } = await supabase
    .from("estimates")
    .insert({
      organization_id: orgId,
      branch_id: params.branch_id ?? null,
      customer_id: params.customer_id,
      vehicle_id: params.vehicle_id,
      estimate_number: estimateNumber,
      status: "draft",
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

  const { error: itemsError } = await supabase
    .from("estimate_items")
    .insert(itemsToInsert);

  if (itemsError) {
    // Clean up the estimate if items failed
    await supabase.from("estimates").delete().eq("id", estimate.id);
    throw new Error(itemsError.message ?? "Failed to create estimate items");
  }

  // Recalculate totals
  await recalculateEstimateTotals(estimate.id);

  revalidateTag(cacheTags.estimates(orgId), "max");

  const created = await getEstimate(estimate.id);
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
  id: string,
  orgId: string,
  params: UpdateEstimateParams,
): Promise<EstimateDetail> {
  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;

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

  const { error } = await supabase
    .from("estimates")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Estimate not found");

  // If items are provided, replace all items
  if (params.items) {
    // Delete existing items
    await supabase.from("estimate_items").delete().eq("estimate_id", id);

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

    const { error: itemsError } = await supabase
      .from("estimate_items")
      .insert(itemsToInsert);

    if (itemsError)
      throw new Error(itemsError.message ?? "Failed to update estimate items");
  }

  await recalculateEstimateTotals(id);

  revalidateTag(cacheTags.estimates(orgId), "max");
  revalidateTag(cacheTags.estimate(id), "max");

  const updated = await getEstimate(id);
  if (!updated) throw new NotFoundError("Estimate not found");
  return updated;
}

// ── Update Estimate Status ────────────────────────────────────

/**
 * Updates just the status of an estimate.
 */
export async function updateEstimateStatus(
  id: string,
  orgId: string,
  status: EstimateStatus,
): Promise<EstimateDetail> {
  return updateEstimate(id, orgId, { status });
}

// ── Delete Estimate ───────────────────────────────────────────

/**
 * Soft-deletes an estimate.
 */
export async function deleteEstimate(id: string, orgId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
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
  estimateId: string,
  orgId: string,
): Promise<import("@/lib/types").WorkOrderDetail> {
  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new UnauthorizedError();

  // Fetch the estimate with items
  const estimate = await getEstimate(estimateId);
  if (!estimate) throw new NotFoundError("Estimate not found");
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
  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();

  // Create the work order
  const { data: wo, error: woError } = await supabase
    .from("work_orders")
    .insert({
      organization_id: orgId,
      branch_id: branch?.id ?? null,
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
  await supabase.from("work_order_status_history").insert({
    work_order_id: wo.id,
    organization_id: orgId,
    status: "New",
    notes: `Created from estimate #${estimate.estimate_number}`,
    created_by: user.id,
  });

  // Add each estimate item as a service or part on the work order
  for (const item of estimate.items) {
    if (item.item_type === "service" || item.item_type === "custom") {
      await addServiceToWorkOrder(wo.id, orgId, {
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
      await addPartToWorkOrder(wo.id, orgId, {
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
  await recalculateWorkOrderTotals(wo.id);

  // Mark estimate as converted
  await supabase
    .from("estimates")
    .update({
      status: "converted",
      converted_work_order_id: wo.id,
      updated_by: user.id,
    })
    .eq("id", estimateId)
    .eq("organization_id", orgId);

  // Revalidate caches
  revalidateTag(cacheTags.estimates(orgId), "max");
  revalidateTag(cacheTags.estimate(estimateId), "max");
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.bayView(orgId, orgId), "max");

  // Return the work order detail
  const { getWorkOrder } = await import("@/lib/services/work-order-service");
  return getWorkOrder(wo.id);
}
