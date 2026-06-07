import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError } from "@/lib/errors";
import type {
  AddPartParams,
  AddServiceParams,
  WorkOrderPart,
  WorkOrderService,
} from "@/lib/types";

// ── Add Service to Work Order ──────────────────────────────────
export async function addServiceToWorkOrder(
  db: SupabaseClient,
  workOrderId: string,
  orgId: string,
  serviceData: AddServiceParams,
): Promise<WorkOrderService> {
  const supabase = db;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quantity = serviceData.quantity ?? 1;
  const unitPrice = serviceData.unit_price;
  let finalPrice = unitPrice * quantity;

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

  // Recalculate totals and invalidate caches (imported function)
  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");

  return data as unknown as WorkOrderService;
}

// ── Add Part to Work Order ─────────────────────────────────────
export async function addPartToWorkOrder(
  db: SupabaseClient,
  workOrderId: string,
  orgId: string,
  partData: AddPartParams,
): Promise<WorkOrderPart> {
  const supabase = db;
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

  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");

  return data as unknown as WorkOrderPart;
}

// ── Update Service Price ────────────────────────────────────────
export async function updateWorkOrderServicePrice(
  db: SupabaseClient,
  serviceId: string,
  workOrderId: string,
  params: { final_price?: number; quantity?: number },
  orgId: string,
): Promise<void> {
  const supabase = db;

  // Build the update payload
  const updatePayload: Record<string, number> = {};

  if (params.quantity !== undefined) {
    // Quantity changed — recalculate final_price from unit_price * quantity
    const { data: current } = await supabase
      .from("work_order_services")
      .select("unit_price")
      .eq("id", serviceId)
      .eq("work_order_id", workOrderId)
      .single();

    const unitPrice = Number(current?.unit_price ?? 0);
    updatePayload.quantity = params.quantity;
    updatePayload.final_price = unitPrice * params.quantity;
  }

  if (params.final_price !== undefined) {
    // Price overridden directly
    updatePayload.final_price = params.final_price;
  }

  if (Object.keys(updatePayload).length === 0) return;

  const { error } = await supabase
    .from("work_order_services")
    .update(updatePayload)
    .eq("id", serviceId)
    .eq("work_order_id", workOrderId);

  if (error) throw new NotFoundError("Service line item not found");

  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");
}

// ── Remove Service ─────────────────────────────────────────────
export async function removeServiceFromWorkOrder(
  db: SupabaseClient,
  serviceId: string,
  workOrderId: string,
  orgId: string,
): Promise<void> {
  const supabase = db;

  const { error } = await supabase
    .from("work_order_services")
    .delete()
    .eq("id", serviceId)
    .eq("work_order_id", workOrderId);

  if (error) throw new NotFoundError("Service line item not found");

  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");
}

// ── Update Part Price ────────────────────────────────────────────
export async function updateWorkOrderPartPrice(
  db: SupabaseClient,
  partId: string,
  workOrderId: string,
  params: { final_price?: number; quantity?: number },
  orgId: string,
): Promise<void> {
  const supabase = db;

  // Build the update payload
  const updatePayload: Record<string, number> = {};

  if (params.quantity !== undefined) {
    // Quantity changed — recalculate final_price from unit_price * quantity
    const { data: current } = await supabase
      .from("work_order_parts")
      .select("unit_price")
      .eq("id", partId)
      .eq("work_order_id", workOrderId)
      .single();

    const unitPrice = Number(current?.unit_price ?? 0);
    updatePayload.quantity = params.quantity;
    updatePayload.final_price = unitPrice * params.quantity;
  }

  if (params.final_price !== undefined) {
    // Price overridden directly
    updatePayload.final_price = params.final_price;
  }

  if (Object.keys(updatePayload).length === 0) return;

  const { error } = await supabase
    .from("work_order_parts")
    .update(updatePayload)
    .eq("id", partId)
    .eq("work_order_id", workOrderId);

  if (error) throw new NotFoundError("Part line item not found");

  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");
}

// ── Remove Part ────────────────────────────────────────────────
export async function removePartFromWorkOrder(
  db: SupabaseClient,
  partId: string,
  workOrderId: string,
  orgId: string,
): Promise<void> {
  const supabase = db;

  const { error } = await supabase
    .from("work_order_parts")
    .delete()
    .eq("id", partId)
    .eq("work_order_id", workOrderId);

  if (error) throw new NotFoundError("Part line item not found");

  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");
}
