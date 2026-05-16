import { revalidateTag } from "next/cache";
import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import { syncWorkOrderToSchedules } from "@/lib/services/service-reminder-service";
import type {
  Customer,
  MechanicAssignment,
  Vehicle,
  WorkOrder,
  WorkOrderDetail,
  WorkOrderPart,
  WorkOrderService,
  WorkOrderStatusHistory,
} from "@/lib/database.types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getWorkOrderDetail as _getWorkOrderDetail } from "@/lib/services/_queries/work-order-queries";
import type {
  AddPartParams,
  AddServiceParams,
  CreateWorkOrderParams,
  WorkOrderFilters,
} from "@/lib/types";

// ── Helper: get current user's org ────────────────────────────
async function _getOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  const { data: membership } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();
  if (!membership?.organization_id)
    throw new ValidationError("Organization not found");
  return membership.organization_id;
}

// ── Helper: insert status history ──────────────────────────────
async function insertStatusHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workOrderId: string,
  orgId: string,
  status: string,
  notes?: string,
) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from("work_order_status_history").insert({
    work_order_id: workOrderId,
    organization_id: orgId,
    status,
    notes: notes ?? null,
    created_by: userId,
  });
}

// ── Work order with minimal joined data for list views
interface WorkOrderWithRefs extends WorkOrder {
  customer: Pick<Customer, "first_name" | "last_name" | "phone"> | null;
  vehicle: Pick<Vehicle, "plate_number" | "make" | "model"> | null;
}

// ── Get Work Orders ──────────────────────────────────────────
export async function getWorkOrders(
  orgId: string,
  filters?: WorkOrderFilters,
): Promise<WorkOrderWithRefs[]> {
  const supabase = await createClient();

  return withCache(
    ["getWorkOrders", orgId, JSON.stringify(filters ?? {})],
    async () => {
      let query = supabase
        .from("work_orders")
        .select(`
        *,
        customer:customers(first_name, last_name, phone),
        vehicle:vehicles(plate_number, make, model)
      `)
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.mechanic_id)
        query = query.eq("mechanic_id", filters.mechanic_id);
      if (filters?.date) {
        const dayStart = `${filters.date}T00:00:00`;
        const dayEnd = `${filters.date}T23:59:59`;
        query = query.gte("created_at", dayStart).lte("created_at", dayEnd);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message ?? "Failed to fetch work orders");
      return (data ?? []) as WorkOrderWithRefs[];
    },
    {
      tags: [cacheTags.workOrders(orgId)],
      revalidate: cacheDurations.workOrders,
    },
  );
}

// ── Get Single Work Order (with detail) ───────────────────────
export async function getWorkOrder(id: string): Promise<WorkOrderDetail> {
  const supabase = await createClient();

  return withCache(
    ["getWorkOrder", id],
    async () => _getWorkOrderDetail(supabase, id),
    {
      tags: [cacheTags.workOrderDetail(id)],
      revalidate: cacheDurations.workOrderDetail,
    },
  );
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
      discount_amount: params.discount_amount ?? 0,
      discount_percentage: params.discount_percentage ?? 0,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (woError || !wo)
    throw new Error(woError?.message ?? "Failed to create work order");

  // Insert status history
  await insertStatusHistory(supabase, wo.id, orgId, "New");

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
    for (const svc of params.services) {
      await addServiceToWorkOrder(wo.id, orgId, svc);
    }
  }

  // Add parts
  if (params.parts?.length) {
    for (const part of params.parts) {
      await addPartToWorkOrder(wo.id, orgId, part);
    }
  }

  // Invalidate list caches
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(
    cacheTags.dailyWorkOrders(orgId, new Date().toISOString().split("T")[0]),
    "max",
  );

  return getWorkOrder(wo.id);
}

// ── Update Work Order Status ──────────────────────────────────
export async function updateWorkOrderStatus(
  id: string,
  orgId: string,
  newStatus: string,
  notes?: string,
): Promise<WorkOrder> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("work_orders")
    .update({ status: newStatus, updated_by: userId })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) throw new NotFoundError("Work order not found");

  await insertStatusHistory(supabase, id, orgId, newStatus, notes);

  // Auto-create/update service schedules when work order completes
  if (newStatus === "Completed") {
    await supabase
      .from("work_orders")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", id);
    syncWorkOrderToSchedules(id).catch((err) =>
      console.error("Failed to sync work order to schedules:", err),
    );
  }

  // Invalidate caches
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.workOrder(id), "max");
  revalidateTag(cacheTags.workOrderDetail(id), "max");
  revalidateTag(
    cacheTags.dailyWorkOrders(orgId, new Date().toISOString().split("T")[0]),
    "max",
  );

  return data;
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
    .select("*")
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

  return data;
}

// ── Add Service to Work Order ──────────────────────────────────
export async function addServiceToWorkOrder(
  workOrderId: string,
  orgId: string,
  serviceData: AddServiceParams,
): Promise<WorkOrderService> {
  const supabase = await createClient();

  // Get current user for RLS compliance
  const { data: { user } } = await supabase.auth.getUser();

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
    })
    .select("*")
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

  // Invalidate caches
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");

  return data;
}

// ── Add Part to Work Order ─────────────────────────────────────
export async function addPartToWorkOrder(
  workOrderId: string,
  orgId: string,
  partData: AddPartParams,
): Promise<WorkOrderPart> {
  const supabase = await createClient();

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
      discount_amount: partData.discount_amount ?? 0,
      discount_percentage: partData.discount_percentage ?? 0,
      final_price: finalPrice,
      notes: partData.notes ?? null,
    })
    .select("*")
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

  // ── Record inventory deduction ────────────────────────────
  // If the part is linked to the catalog, create a 'sale' movement
  // so the inventory ledger reflects actual stock consumption.
  if (partData.part_id) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("inventory_movements").insert({
      organization_id: orgId,
      part_id: partData.part_id,
      movement_type: "sale",
      quantity: quantity,
      unit_price: unitPrice,
      reference_type: "work_order",
      reference_id: workOrderId,
      created_by: userId,
    });
  }

  // Invalidate caches
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");

  return data;
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

  // Invalidate caches
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

  // Invalidate caches
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Get Work Order Totals ──────────────────────────────────────
export async function getWorkOrderTotals(workOrderId: string) {
  const _supabase = await createClient();

  const wo = await getWorkOrder(workOrderId);

  const servicesTotal = wo.services.reduce(
    (sum, s) => sum + Number(s.unit_price) * s.quantity,
    0,
  );
  const servicesDiscount = wo.services.reduce(
    (sum, s) =>
      sum +
      Number(s.discount_amount ?? 0) +
      (Number(s.discount_percentage ?? 0) / 100) *
        Number(s.unit_price) *
        s.quantity,
    0,
  );
  const partsTotal = wo.parts.reduce(
    (sum, p) => sum + Number(p.unit_price) * p.quantity,
    0,
  );
  const partsDiscount = wo.parts.reduce(
    (sum, p) =>
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

  return withCache(
    ["getDailyWorkOrders", orgId, targetDate],
    async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .gte("created_at", `${targetDate}T00:00:00`)
        .lte("created_at", `${targetDate}T23:59:59`)
        .order("created_at", { ascending: false });

      if (error)
        throw new Error(error.message ?? "Failed to fetch daily work orders");
      return data ?? [];
    },
    {
      tags: [cacheTags.dailyWorkOrders(orgId, targetDate)],
      revalidate: cacheDurations.workOrders,
    },
  );
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
