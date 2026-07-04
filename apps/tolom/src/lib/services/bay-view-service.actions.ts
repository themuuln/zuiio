"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { UnauthorizedError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import * as service from "./bay-view-service";
import type {
  BayViewData,
  ShiftReport,
  UpdateStatusParams,
} from "./bay-view-service.types";

/** Thin auth helper for server actions. Creates client, checks auth, resolves orgId. */
async function withOrg<T>(
  fn: (db: SupabaseClient, orgId: string) => Promise<T>,
): Promise<T> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  const { data: orgIdRaw } = await supabase.rpc("get_user_organization_id");
  const orgId = orgIdRaw as string;
  if (!orgId) throw new UnauthorizedError("Choose an organization to continue");

  return fn(supabase, orgId);
}

/** Thin auth helper that also provides userId. */
async function withOrgAndUser<T>(
  fn: (db: SupabaseClient, orgId: string, userId: string) => Promise<T>,
): Promise<T> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  const { data: orgIdRaw } = await supabase.rpc("get_user_organization_id");
  const orgId = orgIdRaw as string;
  if (!orgId) throw new UnauthorizedError("Choose an organization to continue");

  return fn(supabase, orgId, user.id);
}

// ── Read functions (data fetching) ──

export async function getBayViewData(branchId?: string): Promise<BayViewData> {
  return withOrg((db, orgId) => service.getBayViewData(db, orgId, branchId));
}

export async function getBayViewDataFresh(
  branchId?: string,
): Promise<BayViewData> {
  return withOrg((db, orgId) =>
    service.getBayViewDataFresh(db, orgId, branchId),
  );
}

export async function getShiftReport(branchId?: string): Promise<ShiftReport> {
  return withOrg((db, orgId) => service.getShiftReport(db, orgId, branchId));
}

// ── Mutation functions ──

export async function assignVehicleToBay(
  workOrderId: string,
  bayNumber: number,
): Promise<void> {
  return withOrg((db, orgId) =>
    service.assignVehicleToBay(db, orgId, workOrderId, bayNumber),
  );
}

export async function swapBayNumbers(
  workOrderIdA: string,
  bayNumberA: number,
  workOrderIdB: string,
  bayNumberB: number,
): Promise<void> {
  return withOrg((db, orgId) =>
    service.swapBayNumbers(
      db,
      orgId,
      workOrderIdA,
      bayNumberA,
      workOrderIdB,
      bayNumberB,
    ),
  );
}

export async function removeVehicleFromBay(workOrderId: string): Promise<void> {
  return withOrg((db, orgId) =>
    service.removeVehicleFromBay(db, orgId, workOrderId),
  );
}

export async function assignMechanicToWorkOrder(
  workOrderId: string,
  mechanicId: string,
): Promise<void> {
  return withOrg((db, orgId) =>
    service.assignMechanicToWorkOrder(db, orgId, workOrderId, mechanicId),
  );
}

export async function unassignMechanicFromWorkOrder(
  workOrderId: string,
): Promise<void> {
  return withOrg((db, orgId) =>
    service.unassignMechanicFromWorkOrder(db, orgId, workOrderId),
  );
}

export async function assignHelperToWorkOrder(
  workOrderId: string,
  mechanicId: string,
): Promise<void> {
  return withOrgAndUser((db, orgId, userId) =>
    service.assignHelperToWorkOrder(db, orgId, workOrderId, mechanicId, userId),
  );
}

export async function removeHelperFromWorkOrder(
  workOrderId: string,
  mechanicId: string,
): Promise<void> {
  return withOrg((db, orgId) =>
    service.removeHelperFromWorkOrder(db, orgId, workOrderId, mechanicId),
  );
}

export async function updateWorkOrderStatus(
  workOrderId: string,
  status: UpdateStatusParams["status"],
  notes?: string,
): Promise<void> {
  return withOrg((db, orgId) =>
    service.updateWorkOrderStatus(db, orgId, workOrderId, status, notes),
  );
}

export async function updateWorkOrderNotes(
  workOrderId: string,
  notes: string,
): Promise<void> {
  return withOrg(async (db, orgId) => {
    const { error } = await db
      .from("work_orders")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", workOrderId)
      .eq("organization_id", orgId);

    if (error) throw new Error(error.message ?? "Failed to update notes");
  });
}

export async function batchCompleteWorkOrders(workOrderIds: string[]): Promise<{
  succeeded: number;
  failed: number;
  errors: Array<{ woId: string; error: string }>;
}> {
  return withOrg((db, orgId) =>
    service.batchCompleteWorkOrders(db, orgId, workOrderIds),
  );
}

export async function updateBayCount(count: number): Promise<number> {
  return withOrg((db, orgId) => service.updateBayCount(db, orgId, count));
}

export async function reorderQueue(
  updates: { id: string; queue_order: number }[],
): Promise<void> {
  return withOrg((db, orgId) => service.reorderQueue(db, orgId, updates));
}

export async function reorderWorkOrderHelpers(
  workOrderId: string,
  orderedMechanicIds: string[],
): Promise<void> {
  return withOrg((db, orgId) =>
    service.reorderWorkOrderHelpers(db, orgId, workOrderId, orderedMechanicIds),
  );
}

export async function updateBayViewPin(
  currentPin: string,
  newPin: string,
  confirmPin: string,
): Promise<void> {
  return withOrg((db, orgId) =>
    service.updateBayViewPin(db, orgId, currentPin, newPin, confirmPin),
  );
}
