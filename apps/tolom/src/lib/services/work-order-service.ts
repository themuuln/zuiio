import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { capture } from "@/lib/capture";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { reportServerError } from "@/lib/sentry-report-server";
import { getWorkOrderDetail as _getWorkOrderDetail } from "@/lib/services/_queries/work-order-queries";
import { withDbCapture } from "@/lib/supabase/query";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";
import type {
  CreateWorkOrderParams,
  Customer,
  Vehicle,
  WorkOrder,
  WorkOrderDetail,
  WorkOrderFilters,
} from "@/lib/types";
import {
  addPartToWorkOrder,
  addServiceToWorkOrder,
} from "./work-order-items-service";

// ── Work order with minimal joined data for list views
interface WorkOrderWithRefs extends WorkOrder {
  customer: Pick<Customer, "first_name" | "last_name" | "phone"> | null;
  vehicle: Pick<Vehicle, "plate_number" | "make" | "model"> | null;
  mechanic: { full_name: string | null } | null;
  services_cost?: number;
  parts_cost?: number;
  services_revenue?: number;
  parts_revenue?: number;
  gross_profit?: number;
  margin_percent?: number;
}

// ── Get Work Orders ──────────────────────────────────────────
export async function getWorkOrders(
  db: SupabaseClient,
  orgId: string,
  filters?: WorkOrderFilters,
  page?: number,
  pageSize?: number,
  limit = 50,
): Promise<WorkOrderWithRefs[]> {
  const supabase = db;
  const usePagination = typeof page === "number" && page > 0;
  const effectivePage = usePagination ? page : 1;
  const effectivePageSize = usePagination ? (pageSize ?? 50) : limit;

  let query = supabase
    .from("work_orders")
    .select(
      `
        id, organization_id, branch_id, customer_id, vehicle_id, status,
        complaint, description, bay_number, created_at, updated_at,
        mechanic_id, total, subtotal, discount_total, discount_amount,
        discount_percentage, odometer_at_service, queue_order, notes,
        completed_at, started_at, loss_reason,
        customer:customers(first_name, last_name, phone),
        vehicle:vehicles(plate_number, make, model),
        mechanic_profile:profiles!work_orders_mechanic_id_fkey(full_name, avatar_url)
      `,
      usePagination ? { count: "exact" } : undefined,
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }
  if (filters?.mechanic_id)
    query = query.eq("mechanic_id", filters.mechanic_id);
  if (filters?.date) {
    const dayStart = `${filters.date}T00:00:00`;
    const dayEnd = `${filters.date}T23:59:59`;
    query = query.gte("created_at", dayStart).lte("created_at", dayEnd);
  }
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `id::text.ilike.${term},customer.full_name.ilike.${term},vehicle.plate_number.ilike.${term}`,
    );
  }
  if (filters?.branchId) query = withBranchFilter(query, filters.branchId);

  if (usePagination) {
    const from = (effectivePage - 1) * effectivePageSize;
    const to = from + effectivePageSize - 1;
    query = query.range(from, to);
  } else {
    query = query.limit(limit + 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Failed to fetch work orders");

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    organization_id: string;
    branch_id: string | null;
    customer_id: string | null;
    vehicle_id: string | null;
    status: string;
    complaint: string | null;
    description: string | null;
    bay_number: number | null;
    created_at: string;
    updated_at: string | null;
    mechanic_id: string | null;
    total: number | null;
    subtotal: number | null;
    discount_total: number | null;
    discount_amount: number | null;
    discount_percentage: number | null;
    odometer_at_service: number | null;
    queue_order: number | null;
    notes: string | null;
    completed_at: string | null;
    started_at: string | null;
    loss_reason: string | null;
    customer: {
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    } | null;
    vehicle: {
      plate_number: string | null;
      make: string | null;
      model: string | null;
    } | null;
    mechanic_profile: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  }>;

  // Fetch costs from the work_order_costs view separately (it's a view, not a table,
  // so FK-based joins are not supported by the schema cache).
  const workOrderIds = rows.map((r) => r.id);
  const costsMap = new Map<
    string,
    {
      services_cost: number | null;
      parts_cost: number | null;
      services_revenue: number | null;
      parts_revenue: number | null;
      gross_profit: number | null;
      margin_percent: number | null;
    }
  >();

  if (workOrderIds.length > 0) {
    const { data: costRows } = await supabase
      .from("work_order_costs")
      .select(
        "work_order_id, services_cost, parts_cost, services_revenue, parts_revenue, gross_profit, margin_percent",
      )
      .in("work_order_id", workOrderIds);

    if (costRows) {
      for (const c of costRows) {
        costsMap.set(c.work_order_id, c);
      }
    }
  }

  return rows.map((r) => {
    const c = costsMap.get(r.id);
    return {
      ...r,
      grand_total: r.total ?? 0,
      services_cost: c?.services_cost ?? 0,
      parts_cost: c?.parts_cost ?? 0,
      services_revenue: c?.services_revenue ?? 0,
      parts_revenue: c?.parts_revenue ?? 0,
      gross_profit: c?.gross_profit ?? 0,
      margin_percent: c?.margin_percent ?? 0,
      mechanic: r.mechanic_profile
        ? r.mechanic_profile
        : r.mechanic_id
          ? { full_name: null, avatar_url: null }
          : null,
    };
  }) as unknown as WorkOrderWithRefs[];
}

/**
 * Fast work order list using the get_work_orders_list RPC function.
 * Single DB call replaces the multi-table PostgREST query + separate cost fetch.
 * Use for simple list views; fall back to getWorkOrders() for pagination/complex filtering.
 */
export async function getWorkOrdersFast(
  db: SupabaseClient,
  orgId: string,
  options?: { status?: string; limit?: number },
): Promise<WorkOrderWithRefs[]> {
  const { data, error } = await withDbCapture(
    "getWorkOrdersFast",
    db.rpc("get_work_orders_list", {
      p_org_id: orgId,
      p_status: options?.status ?? null,
      p_limit: options?.limit ?? 50,
      p_offset: 0,
    }),
  );

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    bay_number: number | null;
    queue_order: number | null;
    created_at: string;
    completed_at: string | null;
    started_at: string | null;
    customer: { full_name: string | null; phone: string | null } | null;
    vehicle: {
      plate_number: string | null;
      make: string | null;
      model: string | null;
    } | null;
    mechanic: { full_name: string | null } | null;
    services_count: number;
    parts_count: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    organization_id: orgId,
    status: r.status,
    bay_number: r.bay_number,
    queue_order: r.queue_order,
    created_at: r.created_at,
    completed_at: r.completed_at,
    started_at: r.started_at,
    customer: r.customer
      ? {
          first_name: r.customer.full_name?.split(" ")[0] ?? null,
          last_name:
            r.customer.full_name?.split(" ").slice(1).join(" ") ?? null,
          phone: r.customer.phone,
        }
      : null,
    vehicle: r.vehicle
      ? {
          plate_number: r.vehicle.plate_number,
          make: r.vehicle.make,
          model: r.vehicle.model,
        }
      : null,
    mechanic: r.mechanic,
    grand_total: 0,
    services_cost: 0,
    parts_cost: 0,
    services_revenue: 0,
    parts_revenue: 0,
    gross_profit: 0,
    margin_percent: 0,
  })) as unknown as WorkOrderWithRefs[];
}

// ── Get Single Work Order (with detail) ───────────────────────
export async function getWorkOrder(
  db: SupabaseClient,
  id: string,
  orgId?: string,
): Promise<WorkOrderDetail> {
  return _getWorkOrderDetail(db, id, orgId);
}

// ── Create Work Order ──────────────────────────────────────────
export async function createWorkOrder(
  db: SupabaseClient,
  orgId: string,
  params: CreateWorkOrderParams,
  userId_?: string,
): Promise<WorkOrderDetail> {
  if (!params.vehicle_id) throw new ValidationError("Vehicle is required");
  const supabase = db;
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const userId = userId_ ?? authUser?.id;

  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });
  if (!resolvedBranchId) {
    throw new ValidationError(
      "No branch found for this work order. Provide a branchId or ensure a main branch exists.",
    );
  }

  const { data: wo, error: woError } = await supabase
    .from("work_orders")
    .insert({
      organization_id: orgId,
      branch_id: resolvedBranchId,
      customer_id: params.customer_id ?? null,
      vehicle_id: params.vehicle_id,
      status: "New",
      mechanic_id: params.mechanic_id ?? null,
      notes: params.notes?.trim() ?? null,
      complaint: params.complaint?.trim() ?? null,
      diagnosis_label_id: params.diagnosis_label_id ?? null,
      discount_amount: params.discount_amount ?? 0,
      discount_percentage: params.discount_percentage ?? 0,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (woError || !wo)
    throw new Error(woError?.message ?? "Failed to create work order");
  const { error: statusError } = await supabase
    .from("work_order_status_history")
    .insert({
      work_order_id: wo.id,
      organization_id: orgId,
      previous_status: null,
      status: "New",
      created_by: userId,
    });
  if (statusError)
    capture(statusError, { context: "[work-order-service] createWorkOrder" });

  if (params.mechanic_id) {
    const { error: mechAssignError } = await supabase
      .from("mechanic_assignments")
      .insert({
        work_order_id: wo.id,
        organization_id: orgId,
        mechanic_id: params.mechanic_id,
        assigned_by: userId,
      });
    if (mechAssignError)
      capture(mechAssignError, {
        context: "[work-order-service] createWorkOrder",
      });
  }

  // Insert services and parts — attempt partial cleanup on failure
  try {
    if (params.services?.length) {
      await Promise.all(
        params.services.map((svc) =>
          addServiceToWorkOrder(db, wo.id, orgId, svc),
        ),
      );
    }

    if (params.parts?.length) {
      await Promise.all(
        params.parts.map((part) => addPartToWorkOrder(db, wo.id, orgId, part)),
      );
    }
  } catch (insertErr) {
    // Best-effort cleanup: delete any services/parts that were inserted
    await supabase
      .from("work_order_services")
      .delete()
      .eq("work_order_id", wo.id);
    await supabase.from("work_order_parts").delete().eq("work_order_id", wo.id);
    await supabase.from("work_orders").delete().eq("id", wo.id);
    throw new Error(
      `Failed to add services/parts to work order: ${insertErr instanceof Error ? insertErr.message : String(insertErr)}`,
    );
  }

  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(
    cacheTags.dailyWorkOrders(orgId, new Date().toISOString().split("T")[0]),
    "max",
  );

  logAuditAfter({
    supabase: db,
    action: "create",
    table_name: "work_orders",
    record_id: wo.id,
    user_id: userId,
    organization_id: orgId,
    new_data: { status: "New", vehicle_id: params.vehicle_id },
  });

  return getWorkOrder(db, wo.id);
}

// ── Recalculate Work Order Totals ──────────────────────────────
export async function recalculateWorkOrderTotals(
  db: SupabaseClient,
  workOrderId: string,
): Promise<void> {
  const supabase = db;

  const [servicesResult, partsResult, woResult] = await Promise.all([
    supabase
      .from("work_order_services")
      .select("final_price")
      .eq("work_order_id", workOrderId),
    supabase
      .from("work_order_parts")
      .select("final_price")
      .eq("work_order_id", workOrderId),
    supabase
      .from("work_orders")
      .select("discount_amount, discount_percentage")
      .eq("id", workOrderId)
      .single(),
  ]);
  if (servicesResult.error) {
    reportServerError(
      "[work-order-service] recalculateWorkOrderTotals: failed to fetch services",
      servicesResult.error,
    );
    throw new Error(
      `Failed to fetch work order services: ${servicesResult.error.message}`,
    );
  }
  if (partsResult.error) {
    reportServerError(
      "[work-order-service] recalculateWorkOrderTotals: failed to fetch parts",
      partsResult.error,
    );
    throw new Error(
      `Failed to fetch work order parts: ${partsResult.error.message}`,
    );
  }
  if (woResult.error) {
    reportServerError(
      "[work-order-service] recalculateWorkOrderTotals: failed to fetch work order",
      woResult.error,
    );
    throw new Error(`Failed to fetch work order: ${woResult.error.message}`);
  }

  const services = servicesResult?.data ?? [];
  const parts = partsResult?.data ?? [];
  const wo = woResult?.data ?? null;
  if (!wo) {
    logger.warn(
      { workOrderId },
      `recalculateWorkOrderTotals: work order not found, skipping totals update`,
    );
    return;
  }

  const servicesTotal = (services ?? []).reduce(
    (sum, s) => sum + Number(s.final_price),
    0,
  );
  const partsTotal = (parts ?? []).reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const subTotal = servicesTotal + partsTotal;

  const flatDiscount = Number(wo.discount_amount ?? 0);
  const pctDiscount = Number(wo.discount_percentage ?? 0);
  const pctDiscountAmount = subTotal > 0 ? subTotal * (pctDiscount / 100) : 0;
  const discountTotal = flatDiscount + pctDiscountAmount;
  const grandTotal = Math.max(subTotal - discountTotal, 0);

  const { error: updateError } = await supabase
    .from("work_orders")
    .update({
      subtotal: subTotal,
      discount_total: discountTotal,
      total: grandTotal,
    })
    .eq("id", workOrderId);

  if (updateError)
    capture(updateError, {
      context: "[work-order-service] recalculateWorkOrderTotals",
    });
}

// ── Get Work Order Totals ──────────────────────────────────────
export async function getWorkOrderTotals(
  db: SupabaseClient,
  workOrderId: string,
) {
  const wo = await getWorkOrder(db, workOrderId);
  const servicesTotal = (wo.services ?? []).reduce(
    (sum: number, s) => sum + Number(s.unit_price) * s.quantity,
    0,
  );
  const partsTotal = (wo.parts ?? []).reduce(
    (sum: number, p) => sum + Number(p.unit_price) * p.quantity,
    0,
  );
  return { servicesTotal, partsTotal, grandTotal: servicesTotal + partsTotal };
}

// ── Get Daily Work Orders ──────────────────────────────────────
export async function getDailyWorkOrders(
  db: SupabaseClient,
  orgId: string,
  date: string,
): Promise<WorkOrderWithRefs[]> {
  return getWorkOrders(db, orgId, { date }, 1, 200, 200);
}

export async function cancelWorkOrder(
  db: SupabaseClient,
  id: string,
  orgId: string,
  reason?: string,
  userId_?: string,
): Promise<void> {
  const supabase = db;
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const userId = userId_ ?? authUser?.id;

  const { data: existing, error: existingError } = await supabase
    .from("work_orders")
    .select("id, status")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (existingError)
    capture(existingError, { context: "[work-order-service] cancelWorkOrder" });

  if (!existing) throw new NotFoundError("Work order not found");
  if (existing.status === "Completed" || existing.status === "Cancelled") {
    throw new ValidationError(
      "Cannot cancel a completed or already cancelled work order",
    );
  }
  const { error: updateError } = await supabase
    .from("work_orders")
    .update({
      status: "Cancelled",
      loss_reason: reason ?? null,
      updated_by: userId,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (updateError)
    capture(updateError, { context: "[work-order-service] cancelWorkOrder" });

  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: "work_orders",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
    old_data: { status: existing.status },
    new_data: { status: "Cancelled", loss_reason: reason ?? null },
  });

  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.workOrder(id), "max");
  revalidateTag(cacheTags.workOrderDetail(id), "max");
}
