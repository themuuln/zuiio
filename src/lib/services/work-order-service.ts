import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { getWorkOrderDetail as _getWorkOrderDetail } from "@/lib/services/_queries/work-order-queries";
import {
  addServiceToWorkOrder,
  addPartToWorkOrder,
} from "./work-order-items-service";
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";
import type {
  CreateWorkOrderParams,
  Customer,
  Vehicle,
  WorkOrder,
  WorkOrderDetail,
  WorkOrderFilters,
} from "@/lib/types";

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
        vehicle:vehicles(plate_number, make, model)
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

  const rows = (data ?? []) as unknown as Array<
    WorkOrderWithRefs & { mechanic_id: string | null }
  >;
  const mechanicIds = [
    ...new Set(rows.flatMap((r) => (r.mechanic_id ? [r.mechanic_id] : []))),
  ] as string[];
  const mechanicMap = new Map<string, string | null>();
  if (mechanicIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", mechanicIds);
    for (const p of profiles ?? []) {
      mechanicMap.set(p.id, p.full_name);
    }
  }

  const workOrderIds = rows.map((r) => r.id);
  const costMap = new Map<
    string,
    {
      services_cost: number;
      parts_cost: number;
      services_revenue: number;
      parts_revenue: number;
    }
  >();

  if (workOrderIds.length > 0) {
    const { data: servicesData } = await supabase
      .from("work_order_services")
      .select("work_order_id, unit_cost, quantity, final_price")
      .in("work_order_id", workOrderIds);

    const { data: partsData } = await supabase
      .from("work_order_parts")
      .select("work_order_id, unit_cost, quantity, final_price")
      .in("work_order_id", workOrderIds);

    for (const id of workOrderIds) {
      costMap.set(id, {
        services_cost: 0,
        parts_cost: 0,
        services_revenue: 0,
        parts_revenue: 0,
      });
    }
    for (const s of servicesData ?? []) {
      const entry = costMap.get(s.work_order_id);
      if (entry) {
        entry.services_cost += Number(s.unit_cost) * s.quantity;
        entry.services_revenue += Number(s.final_price);
      }
    }
    for (const p of partsData ?? []) {
      const entry = costMap.get(p.work_order_id);
      if (entry) {
        entry.parts_cost += Number(p.unit_cost) * p.quantity;
        entry.parts_revenue += Number(p.final_price);
      }
    }
  }

  return rows.map((r) => {
    const costs = costMap.get(r.id);
    const services_revenue = costs?.services_revenue ?? 0;
    const parts_revenue = costs?.parts_revenue ?? 0;
    const total_revenue = services_revenue + parts_revenue;
    const total_cost = (costs?.services_cost ?? 0) + (costs?.parts_cost ?? 0);
    const gross_profit = total_revenue - total_cost;
    const margin_percent =
      total_revenue > 0 ? (gross_profit / total_revenue) * 100 : 0;
    return {
      ...r,
      services_cost: costs?.services_cost ?? 0,
      parts_cost: costs?.parts_cost ?? 0,
      services_revenue,
      parts_revenue,
      gross_profit,
      margin_percent: Math.round(margin_percent * 100) / 100,
      mechanic: r.mechanic_id
        ? { full_name: mechanicMap.get(r.mechanic_id) ?? null }
        : null,
    };
  }) as unknown as unknown as WorkOrderWithRefs[];
}

// ── Get Single Work Order (with detail) ───────────────────────
export async function getWorkOrder(
  db: SupabaseClient,
  id: string,
): Promise<WorkOrderDetail> {
  return _getWorkOrderDetail(db, id);
}

// ── Create Work Order ──────────────────────────────────────────
export async function createWorkOrder(
  db: SupabaseClient,
  orgId: string,
  params: CreateWorkOrderParams,
): Promise<WorkOrderDetail> {
  if (!params.customer_id) throw new ValidationError("Customer is required");
  if (!params.vehicle_id) throw new ValidationError("Vehicle is required");

  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

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
      customer_id: params.customer_id,
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

  await supabase.from("work_order_status_history").insert({
    work_order_id: wo.id,
    organization_id: orgId,
    previous_status: null,
    status: "New",
    created_by: userId,
  });

  if (params.mechanic_id) {
    await supabase.from("mechanic_assignments").insert({
      work_order_id: wo.id,
      organization_id: orgId,
      mechanic_id: params.mechanic_id,
      assigned_by: userId,
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
  revalidateTag(cacheTags.bayView(orgId, orgId), "max");

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

  const services = servicesResult?.data ?? [];
  const parts = partsResult?.data ?? [];
  const wo = woResult?.data ?? null;
  if (!wo) {
    console.warn(
      `[WO ${workOrderId}] recalculateWorkOrderTotals: work order not found, skipping totals update`,
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

  await supabase
    .from("work_orders")
    .update({
      subtotal: subTotal,
      discount_total: discountTotal,
      total: grandTotal,
    })
    .eq("id", workOrderId);
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

// ── Cancel Work Order ──────────────────────────────────────────
export async function cancelWorkOrder(
  db: SupabaseClient,
  id: string,
  orgId: string,
  reason?: string,
): Promise<void> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data: existing } = await supabase
    .from("work_orders")
    .select("id, status")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!existing) throw new NotFoundError("Work order not found");
  if (existing.status === "Completed" || existing.status === "Cancelled") {
    throw new ValidationError(
      "Cannot cancel a completed or already cancelled work order",
    );
  }

  await supabase
    .from("work_orders")
    .update({
      status: "Cancelled",
      loss_reason: reason ?? null,
      updated_by: userId,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.workOrder(id), "max");
  revalidateTag(cacheTags.workOrderDetail(id), "max");
}
