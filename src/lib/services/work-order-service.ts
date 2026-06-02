import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { getWorkOrderDetail as _getWorkOrderDetail } from "@/lib/services/_queries/work-order-queries";
import { syncWorkOrderToSchedules } from "@/lib/services/service-reminder-service";
import { createClient } from "@/lib/supabase/server";
import type {
  AddPartParams,
  AddServiceParams,
  CreateWorkOrderParams,
  Customer,
  MechanicAssignment,
  Vehicle,
  WorkOrder,
  WorkOrderDetail,
  WorkOrderFilters,
  WorkOrderPart,
  WorkOrderService,
} from "@/lib/types";

// ── Helper: insert status history ──────────────────────────────
async function insertStatusHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workOrderId: string,
  orgId: string,
  previousStatus: string | null,
  status: string,
  notes?: string,
) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from("work_order_status_history").insert({
    work_order_id: workOrderId,
    organization_id: orgId,
    previous_status: previousStatus,
    status,
    notes: notes ?? null,
    created_by: userId,
  });
}

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
  orgId: string,
  filters?: WorkOrderFilters,
  page?: number,
  pageSize?: number,
  limit = 50,
): Promise<WorkOrderWithRefs[]> {
  const supabase = await createClient();

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

  if (usePagination) {
    const from = (effectivePage - 1) * effectivePageSize;
    const to = from + effectivePageSize - 1;
    query = query.range(from, to);
  } else {
    query = query.limit(limit + 1);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message ?? "Failed to fetch work orders");

  // ── Enrich with mechanic names ─────────────────────────
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

  // ── Calculate profit/cost for each work order ──────
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
    // Batch query services
    const { data: servicesData } = await supabase
      .from("work_order_services")
      .select("work_order_id, unit_cost, quantity, final_price")
      .in("work_order_id", workOrderIds);

    // Batch query parts
    const { data: partsData } = await supabase
      .from("work_order_parts")
      .select("work_order_id, unit_cost, quantity, final_price")
      .in("work_order_id", workOrderIds);

    // Initialize defaults for all work orders
    for (const id of workOrderIds) {
      costMap.set(id, {
        services_cost: 0,
        parts_cost: 0,
        services_revenue: 0,
        parts_revenue: 0,
      });
    }

    // Aggregate services
    for (const s of servicesData ?? []) {
      const entry = costMap.get(s.work_order_id);
      if (entry) {
        entry.services_cost += Number(s.unit_cost) * s.quantity;
        entry.services_revenue += Number(s.final_price);
      }
    }

    // Aggregate parts
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
export async function getWorkOrder(id: string): Promise<WorkOrderDetail> {
  const supabase = await createClient();
  return _getWorkOrderDetail(supabase, id);
}

// ── Create Work Order ──────────────────────────────────────────
export async function createWorkOrder(
  orgId: string,
  params: CreateWorkOrderParams,
): Promise<WorkOrderDetail> {
  if (!params.customer_id) throw new ValidationError("Customer is required");
  if (!params.vehicle_id) throw new ValidationError("Vehicle is required");

  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // Create the WO
  const { data: wo, error: woError } = await supabase
    .from("work_orders")
    .insert({
      organization_id: orgId,
      branch_id: params.branch_id ?? null,
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

  // Insert status history
  await insertStatusHistory(supabase, wo.id, orgId, null, "New");

  // Assign mechanic if provided
  if (params.mechanic_id) {
    await supabase.from("mechanic_assignments").insert({
      work_order_id: wo.id,
      organization_id: orgId,
      mechanic_id: params.mechanic_id,
      assigned_by: userId,
    });
  }

  // Add services
  if (params.services?.length) {
    await Promise.all(
      params.services.map((svc) => addServiceToWorkOrder(wo.id, orgId, svc)),
    );
  }

  // Add parts
  if (params.parts?.length) {
    await Promise.all(
      params.parts.map((part) => addPartToWorkOrder(wo.id, orgId, part)),
    );
  }

  // Invalidate list caches
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(
    cacheTags.dailyWorkOrders(orgId, new Date().toISOString().split("T")[0]),
    "max",
  );
  revalidateTag(cacheTags.bayView(orgId, orgId), "max");

  return getWorkOrder(wo.id);
}

// ── Update Work Order Status ──────────────────────────────────
export async function updateWorkOrderStatus(
  id: string,
  orgId: string,
  newStatus: string,
  notes?: string,
  lossReason?: string,
): Promise<WorkOrder> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: currentWorkOrder, error: currentWorkOrderError } =
    await supabase
      .from("work_orders")
      .select("id, organization_id, status")
      .eq("id", id)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .single();

  if (currentWorkOrderError || !currentWorkOrder) {
    throw new NotFoundError("Work order not found");
  }

  const previousStatus = currentWorkOrder.status;
  const statusChanged = previousStatus !== newStatus;

  const { data, error } = await supabase
    .from("work_orders")
    .update({
      status: newStatus,
      updated_by: userId,
      loss_reason: lossReason || null,
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, status, mechanic_id, customer_id, vehicle_id, complaint, description, bay_number, notes, odometer_at_service, discount_amount, discount_percentage, discount_total, subtotal, total, queue_order, completed_at, started_at, created_at, updated_at, created_by, updated_by, branch_id, diagnosis_label_id, loss_reason",
    )
    .single();

  if (error || !data) throw new NotFoundError("Work order not found");

  if (statusChanged) {
    await insertStatusHistory(
      supabase,
      id,
      orgId,
      previousStatus,
      newStatus,
      notes,
    );
  }

  // Auto-create/update service schedules when work order completes
  if (newStatus === "Completed") {
    await supabase
      .from("work_orders")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", id);
    syncWorkOrderToSchedules(id).catch((err) =>
      console.error("Failed to sync work order to schedules:", err),
    );

    // ── Deduct inventory for catalog-linked parts ───────────
    // When a WO completes, create 'sale' movements for every part
    // that has a catalog link (part_id IS NOT NULL). This ensures
    // the inventory ledger accurately reflects stock consumption.
    // Graceful degradation: log errors but don't block completion.
    try {
      const { data: parts } = await supabase
        .from("work_order_parts")
        .select("part_id, quantity, unit_price")
        .eq("work_order_id", id)
        .not("part_id", "is", null);

      if (parts?.length) {
        const movements = parts
          .filter((p) => p.part_id)
          .map((p) => ({
            organization_id: orgId,
            part_id: p.part_id,
            movement_type: "sale" as const,
            quantity: p.quantity,
            unit_price: Number(p.unit_price),
            reference_type: "work_order" as const,
            reference_id: id,
            created_by: userId,
          }));

        const { error: mvError } = await supabase
          .from("inventory_movements")
          .insert(movements);

        if (mvError) {
          console.error(
            "Failed to create inventory movements for completed WO:",
            mvError.message,
          );
        }
      }
    } catch (err) {
      console.error(
        "Failed to deduct inventory for completed WO:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Invalidate caches
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.workOrder(id), "max");
  revalidateTag(cacheTags.workOrderDetail(id), "max");
  revalidateTag(
    cacheTags.dailyWorkOrders(orgId, new Date().toISOString().split("T")[0]),
    "max",
  );

  // Revalidate inventory caches if status changed to Completed
  if (newStatus === "Completed") {
    revalidateTag(cacheTags.inventoryMovements(orgId), "max");
    revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  }

  return data as unknown as WorkOrder;
}

// ── Assign Mechanic ────────────────────────────────────────────
export async function assignMechanic(
  workOrderId: string,
  orgId: string,
  mechanicId: string,
): Promise<MechanicAssignment> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // End previous assignments
  await supabase
    .from("mechanic_assignments")
    .update({ unassigned_at: new Date().toISOString() })
    .eq("work_order_id", workOrderId)
    .is("unassigned_at", null);

  // Create new assignment
  const { data, error } = await supabase
    .from("mechanic_assignments")
    .insert({
      work_order_id: workOrderId,
      organization_id: orgId,
      mechanic_id: mechanicId,
      assigned_by: userId,
    })
    .select(
      "id, work_order_id, organization_id, mechanic_id, assigned_by, assigned_at",
    )
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to assign mechanic");

  // Update WO mechanic_id
  await supabase
    .from("work_orders")
    .update({ mechanic_id: mechanicId, updated_by: userId })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  // Invalidate caches
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");

  return data as unknown as MechanicAssignment;
}

// ── Recalculate Work Order Totals ──────────────────────────────
/**
 * Recomputes subtotal, discount_total, and total on the work_orders row
 * by summing final_prices from services and parts tables.
 */
export async function recalculateWorkOrderTotals(
  workOrderId: string,
): Promise<void> {
  const supabase = await createClient();

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

  if (!wo) return;

  const servicesTotal = (services ?? []).reduce(
    (sum, s) => sum + Number(s.final_price),
    0,
  );
  const partsTotal = (parts ?? []).reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const subTotal = servicesTotal + partsTotal;

  // Work-order-level discounts
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

// ── Add Service to Work Order ──────────────────────────────────
export async function addServiceToWorkOrder(
  workOrderId: string,
  orgId: string,
  serviceData: AddServiceParams,
): Promise<WorkOrderService> {
  const supabase = await createClient();

  // Get current user for RLS compliance
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quantity = serviceData.quantity ?? 1;
  const unitPrice = serviceData.unit_price;
  let finalPrice = unitPrice * quantity;

  // Apply discount
  if (serviceData.discount_percentage) {
    finalPrice = finalPrice * (1 - serviceData.discount_percentage / 100);
  }
  if (serviceData.discount_amount) {
    finalPrice = finalPrice - serviceData.discount_amount;
  }
  if (finalPrice < 0) finalPrice = 0;

  const { data, error } = await supabase
    .from("work_order_services")
    .insert({
      work_order_id: workOrderId,
      organization_id: orgId,
      service_catalog_id: serviceData.service_catalog_id,
      service_name: serviceData.service_name,
      quantity,
      unit_price: unitPrice,
      discount_amount: serviceData.discount_amount ?? 0,
      discount_percentage: serviceData.discount_percentage ?? 0,
      final_price: finalPrice,
      notes: serviceData.notes ?? null,
      created_by: user?.id ?? null,
      unit_cost: 0,
    })
    .select(
      "id, work_order_id, organization_id, service_catalog_id, service_name, quantity, unit_price, unit_cost, discount_amount, discount_percentage, final_price, notes, created_by, created_at",
    )
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to add service");

  // Get vehicle info for price history context
  const { data: wo } = await supabase
    .from("work_orders")
    .select("vehicle_id, mechanic_id")
    .eq("id", workOrderId)
    .single();

  let vehicleMake: string | null = null;
  let vehicleModel: string | null = null;
  if (wo?.vehicle_id) {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model")
      .eq("id", wo.vehicle_id)
      .single();
    vehicleMake = vehicle?.make ?? null;
    vehicleModel = vehicle?.model ?? null;
  }

  // Save to price history
  await supabase.from("service_price_history").insert({
    organization_id: orgId,
    service_catalog_id: serviceData.service_catalog_id,
    service_name: serviceData.service_name,
    vehicle_make: vehicleMake,
    vehicle_model: vehicleModel,
    mechanic_id: wo?.mechanic_id ?? null,
    work_order_id: workOrderId,
    quantity,
    unit_price: unitPrice,
    discount_amount: serviceData.discount_amount ?? 0,
    discount_percentage: serviceData.discount_percentage ?? 0,
    final_price: finalPrice,
  });

  // Recalculate totals and invalidate caches
  await recalculateWorkOrderTotals(workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");

  return data as unknown as WorkOrderService;
}

// ── Add Part to Work Order ─────────────────────────────────────
export async function addPartToWorkOrder(
  workOrderId: string,
  orgId: string,
  partData: AddPartParams,
): Promise<WorkOrderPart> {
  const supabase = await createClient();

  // Get current user for RLS compliance
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quantity = partData.quantity ?? 1;
  const unitPrice = partData.unit_price;
  let finalPrice = unitPrice * quantity;

  if (partData.discount_percentage) {
    finalPrice = finalPrice * (1 - partData.discount_percentage / 100);
  }
  if (partData.discount_amount) {
    finalPrice = finalPrice - partData.discount_amount;
  }
  if (finalPrice < 0) finalPrice = 0;

  // Look up unit cost from parts catalog if linked
  let partUnitCost = 0;
  if (partData.part_id) {
    const { data: catalogPart } = await supabase
      .from("parts_catalog")
      .select("purchase_price")
      .eq("id", partData.part_id)
      .single();
    partUnitCost = Number(catalogPart?.purchase_price ?? 0);
  }

  const { data, error } = await supabase
    .from("work_order_parts")
    .insert({
      work_order_id: workOrderId,
      organization_id: orgId,
      part_id: partData.part_id ?? null,
      part_name: partData.part_name,
      part_number: partData.part_number ?? null,
      quantity,
      unit_price: unitPrice,
      unit_cost: partUnitCost,
      discount_amount: partData.discount_amount ?? 0,
      discount_percentage: partData.discount_percentage ?? 0,
      final_price: finalPrice,
      notes: partData.notes ?? null,
      created_by: user?.id ?? null,
    })
    .select(
      "id, work_order_id, organization_id, part_id, part_name, part_number, quantity, unit_price, unit_cost, discount_amount, discount_percentage, final_price, notes, created_at",
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add part");

  // Get vehicle info for price history context
  const { data: wo } = await supabase
    .from("work_orders")
    .select("vehicle_id, mechanic_id")
    .eq("id", workOrderId)
    .single();

  let vehicleMake: string | null = null;
  let vehicleModel: string | null = null;
  if (wo?.vehicle_id) {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model")
      .eq("id", wo.vehicle_id)
      .single();
    vehicleMake = vehicle?.make ?? null;
    vehicleModel = vehicle?.model ?? null;
  }

  // Save to part price history
  await supabase.from("part_price_history").insert({
    organization_id: orgId,
    part_name: partData.part_name,
    part_number: partData.part_number ?? null,
    vehicle_make: vehicleMake,
    vehicle_model: vehicleModel,
    mechanic_id: wo?.mechanic_id ?? null,
    work_order_id: workOrderId,
    quantity,
    unit_price: unitPrice,
    discount_amount: partData.discount_amount ?? 0,
    discount_percentage: partData.discount_percentage ?? 0,
    final_price: finalPrice,
  });

  // ── Inventory deduction happens on WO completion ───────────
  // Movements for catalog-linked parts are created when the work
  // order reaches "Completed" status (see updateWorkOrderStatus).
  // This avoids orphan movements for parts that get removed or WOs
  // that never complete.

  // Recalculate totals and invalidate caches
  await recalculateWorkOrderTotals(workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");

  return data as unknown as WorkOrderPart;
}

// ── Update Service Price ────────────────────────────────────────
export async function updateWorkOrderServicePrice(
  serviceId: string,
  workOrderId: string,
  params: { final_price: number },
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_order_services")
    .update({
      final_price: params.final_price,
      unit_price: params.final_price,
    })
    .eq("id", serviceId)
    .eq("work_order_id", workOrderId);

  if (error) throw new NotFoundError("Service line item not found");

  // Recalculate totals and invalidate caches
  await recalculateWorkOrderTotals(workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Remove Service ─────────────────────────────────────────────
export async function removeServiceFromWorkOrder(
  serviceId: string,
  workOrderId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_order_services")
    .delete()
    .eq("id", serviceId)
    .eq("work_order_id", workOrderId);

  if (error) throw new NotFoundError("Service line item not found");

  // Recalculate totals and invalidate caches
  await recalculateWorkOrderTotals(workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Update Part Price ────────────────────────────────────────────
export async function updateWorkOrderPartPrice(
  partId: string,
  workOrderId: string,
  params: { final_price: number },
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_order_parts")
    .update({
      final_price: params.final_price,
      unit_price: params.final_price,
    })
    .eq("id", partId)
    .eq("work_order_id", workOrderId);

  if (error) throw new NotFoundError("Part line item not found");

  // Recalculate totals and invalidate caches
  await recalculateWorkOrderTotals(workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Remove Part ────────────────────────────────────────────────
export async function removePartFromWorkOrder(
  partId: string,
  workOrderId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_order_parts")
    .delete()
    .eq("id", partId)
    .eq("work_order_id", workOrderId);

  if (error) throw new NotFoundError("Part line item not found");

  // Recalculate totals and invalidate caches
  await recalculateWorkOrderTotals(workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Get Work Order Totals ──────────────────────────────────────
export async function getWorkOrderTotals(workOrderId: string) {
  const [, wo] = await Promise.all([createClient(), getWorkOrder(workOrderId)]);

  const servicesTotal = (wo.services ?? []).reduce(
    (sum: number, s) => sum + Number(s.unit_price) * s.quantity,
    0,
  );
  const servicesDiscount = (wo.services ?? []).reduce(
    (sum: number, s) =>
      sum +
      Number(s.discount_amount ?? 0) +
      (Number(s.discount_percentage ?? 0) / 100) *
        Number(s.unit_price) *
        s.quantity,
    0,
  );
  const partsTotal = (wo.parts ?? []).reduce(
    (sum: number, p) => sum + Number(p.unit_price) * p.quantity,
    0,
  );
  const partsDiscount = (wo.parts ?? []).reduce(
    (sum: number, p) =>
      sum +
      Number(p.discount_amount ?? 0) +
      (Number(p.discount_percentage ?? 0) / 100) *
        Number(p.unit_price) *
        p.quantity,
    0,
  );

  const subTotal = servicesTotal + partsTotal;
  const totalDiscounts = servicesDiscount + partsDiscount;
  const grandTotal = subTotal - totalDiscounts;

  return {
    servicesTotal,
    servicesDiscount,
    partsTotal,
    partsDiscount,
    subTotal,
    totalDiscounts,
    grandTotal: Math.max(grandTotal, 0),
  };
}

// ── Get Daily Work Orders ────────────────────────────────────
export async function getDailyWorkOrders(
  orgId: string,
  date?: string,
): Promise<WorkOrder[]> {
  const supabase = await createClient();

  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("work_orders")
    .select(
      "id, organization_id, branch_id, customer_id, vehicle_id, status, complaint, description, bay_number, created_at, updated_at, mechanic_id, total, subtotal, discount_total, discount_amount, discount_percentage, odometer_at_service, queue_order, notes, completed_at, started_at",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .gte("created_at", `${targetDate}T00:00:00`)
    .lte("created_at", `${targetDate}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(error.message ?? "Failed to fetch daily work orders");
  return (data ?? []) as unknown as WorkOrder[];
}

// ── Soft Delete Work Order ─────────────────────────────────────
export async function cancelWorkOrder(
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { error } = await supabase
    .from("work_orders")
    .update({
      status: "Cancelled",
      deleted_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Work order not found");

  await insertStatusHistory(
    supabase,
    id,
    orgId,
    "Cancelled",
    "Work order cancelled",
  );

  // Invalidate caches
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.workOrder(id), "max");
  revalidateTag(cacheTags.workOrderDetail(id), "max");
  revalidateTag(
    cacheTags.dailyWorkOrders(orgId, new Date().toISOString().split("T")[0]),
    "max",
  );
}
