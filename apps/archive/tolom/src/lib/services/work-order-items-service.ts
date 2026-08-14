import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import type {
  AddPartParams,
  AddServiceParams,
  WorkOrderPart,
  WorkOrderService,
} from "@/lib/types";

type WorkOrderItemPriceUpdate = {
  final_price?: number;
  quantity?: number;
  unit_price?: number;
};

type CurrentPriceFields = {
  unit_price: number | null;
  quantity: number | null;
  discount_amount: number | null;
  discount_percentage: number | null;
};

function calculateFinalPrice(
  unitPrice: number,
  quantity: number,
  discountAmount: number | null,
  discountPercentage: number | null,
): number {
  let finalPrice = unitPrice * quantity;

  if (discountPercentage) {
    finalPrice *= 1 - discountPercentage / 100;
  }
  if (discountAmount) {
    finalPrice -= discountAmount;
  }

  return Math.max(0, finalPrice);
}

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
    } catch (error) {
      reportServerError("Unexpected error", error);
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
  } catch (error) {
    reportServerError("Unexpected error", error);
    // Price history insert is non-critical
  }

  // Recalculate totals and invalidate caches (imported function)
  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");

  logAuditAfter({
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
  } catch (error) {
    reportServerError("Unexpected error", error);
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
  } catch (error) {
    reportServerError("Unexpected error", error);
    // Price history insert is non-critical
  }

  const { recalculateWorkOrderTotals } = await import("./work-order-service");
  await recalculateWorkOrderTotals(db, workOrderId);
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");

  logAuditAfter({
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
  params: WorkOrderItemPriceUpdate,
  orgId: string,
): Promise<void> {
  const supabase = db;

  // Build the update payload
  const updatePayload: Record<string, number> = {};

  if (params.quantity !== undefined || params.unit_price !== undefined) {
    // Unit price / quantity changed — recalculate final_price from unit_price × quantity.
    const { data: current, error: currentError } = await supabase
      .from("work_order_services")
      .select("unit_price, quantity, discount_amount, discount_percentage")
      .eq("id", serviceId)
      .eq("work_order_id", workOrderId)
      .eq("organization_id", orgId)
      .single<CurrentPriceFields>();

    if (currentError || !current) {
      throw new NotFoundError("Service line item not found");
    }

    const unitPrice = params.unit_price ?? Number(current.unit_price ?? 0);
    const quantity = params.quantity ?? Number(current.quantity ?? 1);

    if (params.unit_price !== undefined) updatePayload.unit_price = unitPrice;
    if (params.quantity !== undefined) updatePayload.quantity = quantity;
    updatePayload.final_price = calculateFinalPrice(
      unitPrice,
      quantity,
      current.discount_amount,
      current.discount_percentage,
    );
  }

  if (params.final_price !== undefined) {
    // Price overridden directly by legacy callers.
    updatePayload.final_price = params.final_price;
  }

  if (Object.keys(updatePayload).length === 0) return;

  const { error } = await supabase
    .from("work_order_services")
    .update(updatePayload)
    .eq("id", serviceId)
    .eq("work_order_id", workOrderId)
    .eq("organization_id", orgId);

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
        "service_catalog_id, service_name, quantity, unit_price, discount_amount, discount_percentage",
      )
      .eq("id", serviceId)
      .eq("organization_id", orgId)
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
        params.unit_price !== undefined
          ? params.unit_price
          : params.final_price !== undefined
            ? updatedService.quantity > 0
              ? newFinalPrice / updatedService.quantity
              : 0
            : Number(updatedService.unit_price ?? 0);

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
  } catch (error) {
    reportServerError("Unexpected error", error);
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
  params: WorkOrderItemPriceUpdate,
  orgId: string,
): Promise<void> {
  const supabase = db;

  // Build the update payload
  const updatePayload: Record<string, number> = {};

  if (params.quantity !== undefined || params.unit_price !== undefined) {
    // Unit price / quantity changed — recalculate final_price from unit_price × quantity.
    const { data: current, error: currentError } = await supabase
      .from("work_order_parts")
      .select("unit_price, quantity, discount_amount, discount_percentage")
      .eq("id", partId)
      .eq("work_order_id", workOrderId)
      .eq("organization_id", orgId)
      .single<CurrentPriceFields>();

    if (currentError || !current) {
      throw new NotFoundError("Part line item not found");
    }

    const unitPrice = params.unit_price ?? Number(current.unit_price ?? 0);
    const quantity = params.quantity ?? Number(current.quantity ?? 1);

    if (params.unit_price !== undefined) updatePayload.unit_price = unitPrice;
    if (params.quantity !== undefined) updatePayload.quantity = quantity;
    updatePayload.final_price = calculateFinalPrice(
      unitPrice,
      quantity,
      current.discount_amount,
      current.discount_percentage,
    );
  }

  if (params.final_price !== undefined) {
    // Price overridden directly by legacy callers.
    updatePayload.final_price = params.final_price;
  }

  if (Object.keys(updatePayload).length === 0) return;

  const { error } = await supabase
    .from("work_order_parts")
    .update(updatePayload)
    .eq("id", partId)
    .eq("work_order_id", workOrderId)
    .eq("organization_id", orgId);

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
        "part_name, part_number, quantity, unit_price, discount_amount, discount_percentage",
      )
      .eq("id", partId)
      .eq("organization_id", orgId)
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
        params.unit_price !== undefined
          ? params.unit_price
          : params.final_price !== undefined
            ? updatedPart.quantity > 0
              ? newFinalPrice / updatedPart.quantity
              : 0
            : Number(updatedPart.unit_price ?? 0);

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
  } catch (error) {
    reportServerError("Unexpected error", error);
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
