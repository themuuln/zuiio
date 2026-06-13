import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
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

  // Look up last sold price from price history for this service (best-effort)
  let lastSoldPrice: number | null = null;
  if (serviceData.service_catalog_id) {
    try {
      const { data: lastEntry } = await supabase
        .from("service_price_history")
        .select("unit_price")
        .eq("organization_id", orgId)
        .eq("service_catalog_id", serviceData.service_catalog_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastSoldPrice = lastEntry?.unit_price ?? null;
    } catch {
      // Price history lookup is non-critical — continue without it
    }
  }

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
      last_sold_price: lastSoldPrice,
      notes: serviceData.notes ?? null,
      created_by: user?.id ?? null,
      unit_cost: 0,
    })
    .select(
      "id, work_order_id, organization_id, service_catalog_id, service_name, quantity, unit_price, unit_cost, discount_amount, discount_percentage, final_price, last_sold_price, notes, created_by, created_at",
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

  // Record price history (best-effort — never block the add)
  try {
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
      created_by: user?.id ?? null,
    });
  } catch {
    // Price history insert is non-critical
  }

  // Recalculate totals and invalidate caches (imported function)
  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");

  await createAuditLog({
    supabase: db,
    action: "create",
    table_name: "work_order_services",
    record_id: data.id,
    user_id: user?.id,
    organization_id: orgId,
    new_data: {
      service_name: serviceData.service_name,
      final_price: finalPrice,
    },
  });

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

  // Look up last sold price from price history for this part (best-effort)
  let lastSoldPrice: number | null = null;
  try {
    const { data: lastPartEntry } = await supabase
      .from("part_price_history")
      .select("unit_price")
      .eq("organization_id", orgId)
      .ilike("part_name", partData.part_name)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastSoldPrice = lastPartEntry?.unit_price ?? null;
  } catch {
    // Price history lookup is non-critical — continue without it
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
      last_sold_price: lastSoldPrice,
      notes: partData.notes ?? null,
      created_by: user?.id ?? null,
    })
    .select(
      "id, work_order_id, organization_id, part_id, part_name, part_number, quantity, unit_price, unit_cost, discount_amount, discount_percentage, final_price, last_sold_price, notes, created_at",
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

  // Record price history (best-effort — never block the add)
  try {
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
      created_by: user?.id ?? null,
    });
  } catch {
    // Price history insert is non-critical
  }

  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");

  await createAuditLog({
    supabase: db,
    action: "create",
    table_name: "work_order_parts",
    record_id: data.id,
    user_id: user?.id,
    organization_id: orgId,
    new_data: { part_name: partData.part_name, final_price: finalPrice },
  });

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

  // Record price history (best-effort — never block the update)
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: updatedService, error: fetchErr } = await supabase
      .from("work_order_services")
      .select(
        "service_catalog_id, service_name, quantity, discount_amount, discount_percentage",
      )
      .eq("id", serviceId)
      .single();

    if (!fetchErr && updatedService) {
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

      // Read post-update final_price for the authoritative value
      const { data: postUpdate } = await supabase
        .from("work_order_services")
        .select("final_price")
        .eq("id", serviceId)
        .single();

      const newFinalPrice = Number(postUpdate?.final_price ?? 0);
      const effectiveUnitPrice =
        updatedService.quantity > 0
          ? newFinalPrice / updatedService.quantity
          : 0;

      await supabase.from("service_price_history").insert({
        organization_id: orgId,
        service_catalog_id: updatedService.service_catalog_id,
        service_name: updatedService.service_name,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        mechanic_id: wo?.mechanic_id ?? null,
        work_order_id: workOrderId,
        quantity: updatedService.quantity,
        unit_price: effectiveUnitPrice,
        discount_amount: updatedService.discount_amount ?? 0,
        discount_percentage: updatedService.discount_percentage ?? 0,
        final_price: newFinalPrice,
        created_by: user?.id ?? null,
      });
    }
  } catch {
    // Price history insert is non-critical
  }
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

  // Record price history (best-effort — never block the update)
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: updatedPart, error: fetchErr } = await supabase
      .from("work_order_parts")
      .select(
        "part_name, part_number, quantity, discount_amount, discount_percentage",
      )
      .eq("id", partId)
      .single();

    if (!fetchErr && updatedPart) {
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

      const { data: postUpdate } = await supabase
        .from("work_order_parts")
        .select("final_price")
        .eq("id", partId)
        .single();

      const newFinalPrice = Number(postUpdate?.final_price ?? 0);
      const effectiveUnitPrice =
        updatedPart.quantity > 0
          ? newFinalPrice / updatedPart.quantity
          : 0;

      await supabase.from("part_price_history").insert({
        organization_id: orgId,
        part_name: updatedPart.part_name,
        part_number: updatedPart.part_number ?? null,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        mechanic_id: wo?.mechanic_id ?? null,
        work_order_id: workOrderId,
        quantity: updatedPart.quantity,
        unit_price: effectiveUnitPrice,
        discount_amount: updatedPart.discount_amount ?? 0,
        discount_percentage: updatedPart.discount_percentage ?? 0,
        final_price: newFinalPrice,
        created_by: user?.id ?? null,
      });
    }
  } catch {
    // Price history insert is non-critical
  }
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
