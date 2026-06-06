import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import { syncWorkOrderToSchedules } from "@/lib/services/service-reminder-service";
import type { MechanicAssignment, WorkOrder } from "@/lib/types";

// ── Helper: insert status history ──────────────────────────────
async function insertStatusHistory(
  supabase: SupabaseClient,
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

// ── Update Work Order Status ──────────────────────────────────
export async function updateWorkOrderStatus(
  db: SupabaseClient,
  id: string,
  orgId: string,
  newStatus: string,
  notes?: string,
  lossReason?: string,
): Promise<WorkOrder> {
  const supabase = db;
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

  if (newStatus === "Completed") {
    await supabase
      .from("work_orders")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", id);

    // Schedule sync — fire-and-forget; service reminder schedules are non-critical
    syncWorkOrderToSchedules(id).catch((err) =>
      reportServerError(
        `[WO ${id}] Failed to sync work order to schedules: ${err instanceof Error ? err.message : err}`,
      ),
    );

    // Inventory deduction — check balances before deducting
    try {
      const { data: parts } = await supabase
        .from("work_order_parts")
        .select("part_id, quantity, unit_price")
        .eq("work_order_id", id)
        .not("part_id", "is", null);

      if (parts?.length) {
        const catalogParts = parts.filter((p) => p.part_id);
        if (catalogParts.length > 0) {
          // Check current balances
          const partIds = [...new Set(catalogParts.map((p) => p.part_id!))];
          const { data: balances } = await supabase
            .from("inventory_balances")
            .select("part_id, quantity")
            .in("part_id", partIds)
            .eq("organization_id", orgId);

          const balanceMap = new Map(
            (balances ?? []).map((b) => [b.part_id, Number(b.quantity)]),
          );

          for (const p of catalogParts) {
            const available = balanceMap.get(p.part_id!) ?? 0;
            if (p.quantity > available) {
              console.warn(
                `[WO ${id}] Part ${p.part_id}: deducting ${p.quantity} but only ${available} available in stock`,
              );
            }
          }
        }

        const movements = catalogParts.map((p) => ({
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
          reportServerError(
            `[WO ${id}] Failed to create inventory movements: ${mvError.message}`,
          );
        }
      }
    } catch (err) {
      // Inventory failure is logged but not rethrown — the WO status update
      // has already been committed and cannot be rolled back. Rethrowing here
      // would leave the WO in an inconsistent state with a failed response to
      // the client. Instead, we log the error and continue so the dashboard
      // cache is still invalidated (showing the revenue from the completed WO).
      // The inventory discrepancy should be reconciled via manual stock audit.
      reportServerError(
        `[WO ${id}] Failed to deduct inventory: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.workOrder(id), "max");
  revalidateTag(cacheTags.workOrderDetail(id), "max");
  revalidateTag(
    cacheTags.dailyWorkOrders(orgId, new Date().toISOString().split("T")[0]),
    "max",
  );
  // Invalidate dashboard + reports so revenue/profit KPIs update immediately
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");

  if (newStatus === "Completed") {
    revalidateTag(cacheTags.inventoryMovements(orgId), "max");
    revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  }

  return data as unknown as WorkOrder;
}

// ── Assign Mechanic ────────────────────────────────────────────
export async function assignMechanic(
  db: SupabaseClient,
  workOrderId: string,
  orgId: string,
  mechanicId: string,
): Promise<MechanicAssignment> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  await supabase
    .from("mechanic_assignments")
    .update({ unassigned_at: new Date().toISOString() })
    .eq("work_order_id", workOrderId)
    .is("unassigned_at", null);

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

  await supabase
    .from("work_orders")
    .update({ mechanic_id: mechanicId, updated_by: userId })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");

  return data as unknown as MechanicAssignment;
}
