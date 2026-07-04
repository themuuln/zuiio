// ── Pure Service Functions ─────────────────────────────────────
// All functions accept `db: SupabaseClient` as first parameter and
// `orgId: string` as second parameter. No server action directives,
// no inline auth checks, no createClient() calls.

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createWorkOrder } from "@/lib/services/work-order-service";
import { withBranchFilter } from "@/lib/supabase/with-branch";
import type { Profile } from "@/lib/types";
import type {
  BaySlotData,
  BayViewData,
  BranchInfo,
  BranchSectionData,
  ShiftReport,
  WorkOrderWithDetails,
} from "./bay-view-service.types";
import { updateWorkOrderStatus as updateWorkOrderStatusCanonical } from "./work-order-workflow";
import { capture } from "@/lib/capture";

export type { UpdateStatusParams } from "./bay-view-service.types";
// Re-export types for backward compatibility
export type {
  BaySlotData,
  BayViewData,
  BranchInfo,
  BranchSectionData,
  ShiftReport,
};

// ── Helpers for multi-branch sections ─────────────────────────

/**
 * Build bay slot sections for each branch. Used in "All" mode to display
 * each branch's bays grouped under a branch name header.
 */
function buildBranchSections(
  woWithDetails: WorkOrderWithDetails[],
  allBranches: { id: string; name: string; settings: unknown }[],
): BranchSectionData[] {
  return allBranches.map((branch) => {
    const bayCount =
      ((branch.settings as Record<string, unknown> | null)
        ?.bay_count as number) ?? 6;

    // Bay-assigned work orders belonging to this branch (or legacy null)
    const branchBayWOs = woWithDetails.filter(
      (wo) =>
        wo.bay_number != null &&
        (wo.branch_id === branch.id || wo.branch_id === null),
    );

    const bays: BaySlotData[] = [];
    for (let i = 1; i <= bayCount; i++) {
      const wo = branchBayWOs.find((w) => w.bay_number === i) ?? null;
      bays.push({
        bayNumber: i,
        workOrder: wo as unknown as BaySlotData["workOrder"],
      });
    }

    return { branchId: branch.id, branchName: branch.name, bayCount, bays };
  });
}

// ── Get Bay View Data ──────────────────────────────────────────

async function fetchBayViewData(
  db: SupabaseClient,
  orgId: string,
  branchId?: string,
): Promise<BayViewData> {
  // ── Batch 1: Independent queries (run in parallel) ──
  // branches, work_orders, and organization_users have no deps on each other
  const [{ data: allBranches, error: branchesErr }, { data: activeWOs, error: activeWOsErr }, memberQueryResult] =
    await Promise.all([
      // 1a. Branches (for pills, bay count, branch sections)
      db
        .from("branches")
        .select("id, name, settings")
        .eq("organization_id", orgId)
        .order("name"),
      // 1b. Active work orders (with vehicle + customer joins)
      db
        .from("work_orders")
        .select(`
        *,
        vehicle:vehicle_id (*),
        customer:customer_id (full_name, company_name)
      `)
        .eq("organization_id", orgId)
        .not("status", "in", '("Completed","Cancelled")')
        .is("deleted_at", null)
        .order("queue_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      // 1c. Mechanic role members (for mechanic panel)
      (async () => {
        let q = db
          .from("organization_users")
          .select("user_id, roles!inner(name)")
          .eq("organization_id", orgId)
          .eq("roles.name", "Mechanic")
          .is("removed_at", null);
        if (branchId) {
          q = withBranchFilter(q, branchId) as typeof q;
        }
        return q;
      })(),
    ]);
  if (branchesErr) capture(branchesErr, { context: "[bay-view-service] fetchBayViewData" });
  if (activeWOsErr) capture(activeWOsErr, { context: "[bay-view-service] fetchBayViewData" });
  // Library boundary cast: async IIFE wraps PostgrestFilterBuilder, TS can't narrow the resolved type
  const { error: memberQueryErr } = memberQueryResult as unknown as { error: unknown };
  if (memberQueryErr) capture(memberQueryErr, { context: "[bay-view-service] fetchBayViewData" });

  const workOrders = activeWOs ?? [];

  // Derive branches and bay count from batch 1 results
  const branches: BranchInfo[] = (allBranches ?? []).map((b) => ({
    id: b.id,
    name: b.name,
  }));
  const targetBranches = branchId
    ? (allBranches ?? []).filter((b) => b.id === branchId)
    : (allBranches ?? []);
  const primaryBranch = targetBranches[0] ?? null;
  const bayCount =
    ((primaryBranch?.settings as unknown as Record<string, unknown> | null)
      ?.bay_count as number) ?? 6;

  // Collect IDs needed for batch 2
  const mainMechanicIds = [
    ...new Set(
      workOrders.flatMap((wo) =>
        wo.mechanic_id ? [wo.mechanic_id as string] : [],
      ),
    ),
  ];
  const activeWoIds = workOrders.map((wo) => wo.id);
  const mechUserIds = (memberQueryResult.data ?? []).map((m: any) => m.user_id);

  // ── Batch 2: Dependent queries (run in parallel) ──
  const [
    { data: helperRecords, error: helpersErr },
    { data: woMechanicProfiles, error: woMechErr },
    { data: mechProfiles, error: mechErr },
  ] = await Promise.all([
    // 2a. Helper records (needs activeWoIds)
    activeWoIds.length > 0
      ? db
          .from("work_order_helpers")
          .select("work_order_id, mechanic_id, sort_order")
          .in("work_order_id", activeWoIds)
          .order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    // 2b. Mechanic profiles for work order assignments
    mainMechanicIds.length > 0
      ? db
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", mainMechanicIds)
      : Promise.resolve({ data: [], error: null }),
    // 2c. Mechanic profiles for mechanic panel
    mechUserIds.length > 0
      ? db
          .from("profiles")
          .select("id, full_name, phone, avatar_url")
          .in("id", mechUserIds)
          .order("full_name")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (helpersErr) capture(helpersErr, { context: "[bay-view-service] fetchBayViewData" });
  if (woMechErr) capture(woMechErr, { context: "[bay-view-service] fetchBayViewData" });
  if (mechErr) capture(mechErr, { context: "[bay-view-service] fetchBayViewData" });

  // ── Assembly ──
  const helperMechanicIds = [
    ...new Set((helperRecords ?? []).map((h: any) => h.mechanic_id)),
  ];
  const allMechanicIds = [
    ...new Set([...mainMechanicIds, ...helperMechanicIds]),
  ];

  // Fetch remaining mechanic profiles (those only in helpers, not in main)
  const extraMechIds = allMechanicIds.filter(
    (id) => !mainMechanicIds.includes(id),
  );
  const { data: extraProfiles, error: extraErr } =
    extraMechIds.length > 0
      ? await db
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", extraMechIds)
      : { data: [], error: null };
  if (extraErr) capture(extraErr, { context: "[bay-view-service] fetchBayViewData" });

  // Build mechanic lookup map
  const mechanicMap = new Map<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }
  >();
  for (const p of woMechanicProfiles ?? []) {
    mechanicMap.set(p.id, p);
  }
  for (const p of extraProfiles ?? []) {
    mechanicMap.set(p.id, p);
  }

  // Group helper records by work order id
  const helpersByWo = new Map<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }[]
  >();
  for (const h of helperRecords ?? []) {
    if (!helpersByWo.has(h.work_order_id)) {
      helpersByWo.set(h.work_order_id, []);
    }
    const profile = mechanicMap.get(h.mechanic_id);
    if (profile) {
      helpersByWo.get(h.work_order_id)?.push(profile);
    }
  }

  // Attach mechanic info, helpers, and customer name to work orders
  const woWithDetails = workOrders.map((wo) => ({
    ...wo,
    mechanic: wo.mechanic_id ? (mechanicMap.get(wo.mechanic_id) ?? null) : null,
    // Filter out the main mechanic from helpers to avoid duplication
    helpers: (helpersByWo.get(wo.id) ?? []).filter(
      (h) => h.id !== wo.mechanic_id,
    ),
    customer_name: wo.customer?.company_name ?? wo.customer?.full_name ?? null,
  }));

  // Separate bay-assigned vs waiting queue
  const inBay = woWithDetails.filter((wo) => wo.bay_number != null);
  const waiting = woWithDetails.filter((wo) => wo.bay_number == null);

  // When viewing a specific branch, show bay-assigned work orders from that branch
  // only. "All" view shows all bays org-wide. Work orders without a branch_id
  // are excluded from per-branch views to prevent the same car appearing on
  // every branch's grid. Queued work orders are always shown org-wide.
  const inBayThisBranch = branchId
    ? inBay.filter((wo) => wo.branch_id === branchId)
    : inBay;

  // Build bay slots (scoped to current branch)
  const bays: BaySlotData[] = [];
  for (let i = 1; i <= bayCount; i++) {
    const wo = inBayThisBranch.find((w) => w.bay_number === i) ?? null;
    bays.push({
      bayNumber: i,
      workOrder: wo as unknown as BaySlotData["workOrder"],
    });
  }

  // Count jobs: main mechanic OR helper
  const helperJobCount = new Map<string, number>();
  for (const h of helperRecords ?? []) {
    helperJobCount.set(
      h.mechanic_id,
      (helperJobCount.get(h.mechanic_id) ?? 0) + 1,
    );
  }

  const mechList = (mechProfiles ?? []).map((p) => ({
    ...p,
    current_jobs:
      workOrders.filter((wo) => wo.mechanic_id === p.id).length +
      (helperJobCount.get(p.id) ?? 0),
  })) as unknown as (Profile & { current_jobs: number })[];

  // Build branch sections for "All" mode
  const branchSections = branchId
    ? undefined
    : buildBranchSections(woWithDetails, allBranches ?? []);

  return {
    bayCount,
    bays,
    branches,
    branchSections,
    waitingQueue: waiting as unknown as BayViewData["waitingQueue"],
    mechanics: mechList,
  };
}

export async function getBayViewData(
  db: SupabaseClient,
  orgId: string,
  branchId?: string,
): Promise<BayViewData> {
  return fetchBayViewData(db, orgId, branchId);
}

export async function getBayViewDataFresh(
  db: SupabaseClient,
  orgId: string,
  branchId?: string,
): Promise<BayViewData> {
  return fetchBayViewData(db, orgId, branchId);
}

// ── Assign Vehicle to Bay ─────────────────────────────────────

export async function assignVehicleToBay(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  bayNumber: number,
): Promise<void> {
  // Run conflict check, clear old data, and assign in one parallel batch.
  const assignFn = async () => {
    const { error } = await db
      .from("work_orders")
      .update({
        bay_number: bayNumber,
        status: "New" as const,
        complaint: null,
        diagnosis: null,
        notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workOrderId)
      .eq("organization_id", orgId);
    return { error };
  };
  const [{ data: conflict, error: conflictErr }, { error: assignError }] = await Promise.all([
    db
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("bay_number", bayNumber)
      .not("status", "in", '("Completed","Cancelled")')
      .is("deleted_at", null)
      .maybeSingle(),
    assignFn(),
    (async () => {
      const { error: deleteErr } = await db.from("work_order_helpers").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] assignVehicleToBay" });
    })(),
    (async () => {
      const { error: deleteErr } = await db.from("work_order_services").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] assignVehicleToBay" });
    })(),
    (async () => {
      const { error: deleteErr } = await db.from("work_order_parts").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] assignVehicleToBay" });
    })(),
  ]);
  if (conflictErr) capture(conflictErr, { context: "[bay-view-service] assignVehicleToBay" });

  if (conflict && conflict.id !== workOrderId) {
    throw new ValidationError(`Bay ${bayNumber} is already occupied`);
  }

  if (assignError) {
    capture(assignError, { context: "[bay-view-service] assignVehicleToBay" });
    throw new Error(assignError.message ?? "Failed to assign vehicle to bay");
  }

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Swap two occupied bays ─────────────────────────────────────

export async function swapBayNumbers(
  db: SupabaseClient,
  orgId: string,
  workOrderIdA: string,
  bayNumberA: number,
  workOrderIdB: string,
  bayNumberB: number,
): Promise<void> {
  const now = new Date().toISOString();

  // Direct swap: both UPDATEs target different rows, no intermediate "both null" state.
  // If one fails, the other may have succeeded — same tradeoff as the old 3-step approach,
  // minus the window where both bays were null.
  const [{ error: errA }, { error: errB }] = await Promise.all([
    db
      .from("work_orders")
      .update({ bay_number: bayNumberB, updated_at: now })
      .eq("id", workOrderIdA)
      .eq("organization_id", orgId),
    db
      .from("work_orders")
      .update({ bay_number: bayNumberA, updated_at: now })
      .eq("id", workOrderIdB)
      .eq("organization_id", orgId),
  ]);
  if (errA || errB) {
    if (errA) capture(errA, { context: "[bay-view-service] swapBayNumbers" });
    if (errB) capture(errB, { context: "[bay-view-service] swapBayNumbers" });
    throw new Error(errA?.message ?? errB?.message ?? "Failed to swap bays");
  }

  // Clean up helpers for both work orders (non-critical — doesn't affect bay correctness)
  const { error: deleteErr } = await db
    .from("work_order_helpers")
    .delete()
    .in("work_order_id", [workOrderIdA, workOrderIdB]);
  if (deleteErr) capture(deleteErr, { context: "[bay-view-service] swapBayNumbers" });

  revalidateTag(cacheTags.workOrder(workOrderIdA), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderIdA), "max");
  revalidateTag(cacheTags.workOrder(workOrderIdB), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderIdB), "max");
}

// ── Remove Vehicle from Bay ───────────────────────────────────

export async function removeVehicleFromBay(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
): Promise<void> {
  const { error } = await db
    .from("work_orders")
    .update({
      bay_number: null,
      mechanic_id: null,
      status: "New" as const,
      complaint: null,
      diagnosis: null,
      notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) {
    capture(error, { context: "[bay-view-service] removeVehicleFromBay" });
    throw new Error(error.message ?? "Failed to remove vehicle from bay");
  }

  // Clear helpers, services, and parts
  await Promise.all([
    (async () => {
      const { error: deleteErr } = await db.from("work_order_helpers").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] removeVehicleFromBay" });
    })(),
    (async () => {
      const { error: deleteErr } = await db.from("work_order_services").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] removeVehicleFromBay" });
    })(),
    (async () => {
      const { error: deleteErr } = await db.from("work_order_parts").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] removeVehicleFromBay" });
    })(),
  ]);

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Assign Mechanic ────────────────────────────────────────────

export async function assignMechanicToWorkOrder(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  mechanicId: string,
): Promise<void> {
  const { error } = await db
    .from("work_orders")
    .update({
      mechanic_id: mechanicId,
      status: "In Progress" as const,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) {
    capture(error, { context: "[bay-view-service] assignMechanicToWorkOrder" });
    throw new Error(error.message ?? "Failed to assign mechanic");
  }

  // If this mechanic was previously a helper on this WO, remove them from helpers
  const { error: deleteErr } = await db
    .from("work_order_helpers")
    .delete()
    .eq("work_order_id", workOrderId)
    .eq("mechanic_id", mechanicId);
  if (deleteErr) capture(deleteErr, { context: "[bay-view-service] assignMechanicToWorkOrder" });

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Unassign Mechanic ─────────────────────────────────────────

export async function unassignMechanicFromWorkOrder(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
): Promise<void> {
  const { error } = await db
    .from("work_orders")
    .update({
      mechanic_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) {
    capture(error, { context: "[bay-view-service] unassignMechanicFromWorkOrder" });
    throw new Error(error.message ?? "Failed to unassign mechanic");
  }

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Assign Helper Mechanic ──────────────────────────────────────

export async function assignHelperToWorkOrder(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  mechanicId: string,
  userId: string,
): Promise<void> {
  // Check if this mechanic is already a helper on this WO
  const { data: existing, error: existingErr } = await db
    .from("work_order_helpers")
    .select("id")
    .eq("work_order_id", workOrderId)
    .eq("mechanic_id", mechanicId)
    .maybeSingle();
  if (existingErr) capture(existingErr, { context: "[bay-view-service] assignHelperToWorkOrder" });

  if (existing) {
    // Already assigned as helper — no-op
    return;
  }

  // Don't add as helper if they're already the main mechanic
  const { data: wo, error: woErr } = await db
    .from("work_orders")
    .select("mechanic_id")
    .eq("id", workOrderId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (woErr) capture(woErr, { context: "[bay-view-service] assignHelperToWorkOrder" });

  if (wo?.mechanic_id === mechanicId) {
    return; // Already the main mechanic
  }

  const { error } = await db.from("work_order_helpers").insert({
    work_order_id: workOrderId,
    organization_id: orgId,
    mechanic_id: mechanicId,
    created_by: userId,
  });

  if (error) {
    capture(error, { context: "[bay-view-service] assignHelperToWorkOrder" });
    throw new Error(error.message ?? "Failed to assign helper mechanic");
  }

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Remove Helper Mechanic ──────────────────────────────────────

export async function removeHelperFromWorkOrder(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  mechanicId: string,
): Promise<void> {
  const { error } = await db
    .from("work_order_helpers")
    .delete()
    .eq("work_order_id", workOrderId)
    .eq("mechanic_id", mechanicId)
    .eq("organization_id", orgId);

  if (error) {
    capture(error, { context: "[bay-view-service] removeHelperFromWorkOrder" });
    throw new Error(error.message ?? "Failed to remove helper mechanic");
  }

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Reorder Helpers ────────────────────────────────────────────

export async function reorderWorkOrderHelpers(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  orderedMechanicIds: string[],
): Promise<void> {
  // First, get existing helper rows so we can update sort_order by id
  const { data: existing, error: fetchErr } = await db
    .from("work_order_helpers")
    .select("id, mechanic_id")
    .eq("work_order_id", workOrderId)
    .eq("organization_id", orgId);

  if (fetchErr) {
    capture(fetchErr, { context: "[bay-view-service] reorderWorkOrderHelpers" });
    throw new Error(fetchErr.message ?? "Failed to fetch helpers");
  }

  // Build a map of mechanic_id → row id
  const idByMechanic = new Map<string, string>();
  for (const row of existing ?? []) {
    idByMechanic.set(row.mechanic_id, row.id);
  }

  // Update each row's sort_order based on the new ordering
  for (let i = 0; i < orderedMechanicIds.length; i++) {
    const rowId = idByMechanic.get(orderedMechanicIds[i]);
    if (!rowId) continue; // skip if not found (shouldn't happen)
    const { error: updErr } = await db
      .from("work_order_helpers")
      .update({ sort_order: i })
      .eq("id", rowId);

    if (updErr) {
      capture(updErr, { context: "[bay-view-service] reorderWorkOrderHelpers" });
      throw new Error(updErr.message ?? "Failed to reorder helper");
    }
  }

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Clear All Helpers from Work Order ──────────────────────────

export async function clearHelpersFromWorkOrder(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
): Promise<void> {
  const { error: deleteErr } = await db
    .from("work_order_helpers")
    .delete()
    .eq("work_order_id", workOrderId)
    .eq("organization_id", orgId);
  if (deleteErr) capture(deleteErr, { context: "[bay-view-service] clearHelpersFromWorkOrder" });

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Update Work Order Status ───────────────────────────────────

/**
 * Pure service function that delegates to the canonical updateWorkOrderStatus
 * in work-order-workflow.ts. This ensures inventory deduction, schedule sync,
 * and full cache invalidation (dashboardMetrics, reports) run on status change.
 */
export async function updateWorkOrderStatus(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  status:
    | "New"
    | "Diagnosing"
    | "In Progress"
    | "Ready for Pickup"
    | "Completed"
    | "Cancelled",
  notes?: string,
): Promise<void> {
  await updateWorkOrderStatusCanonical(db, workOrderId, orgId, status, notes);
}

// ── Batch Complete ────────────────────────────────────────────

interface BatchCompleteResult {
  succeeded: number;
  failed: number;
  errors: Array<{ woId: string; error: string }>;
}

/**
 * Complete multiple work orders that are in "Ready for Pickup" status.
 * Uses Promise.allSettled so partial success doesn't fail the entire batch.
 */
export async function batchCompleteWorkOrders(
  db: SupabaseClient,
  orgId: string,
  workOrderIds: string[],
): Promise<BatchCompleteResult> {
  const results = await Promise.allSettled(
    workOrderIds.map((woId) =>
      updateWorkOrderStatusCanonical(db, woId, orgId, "Completed"),
    ),
  );

  const errors: Array<{ woId: string; error: string }> = [];
  let succeeded = 0;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      succeeded++;
    } else {
      errors.push({
        woId: workOrderIds[i],
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
  }

  return {
    succeeded,
    failed: errors.length,
    errors,
  };
}

// ── Update Bay Count ───────────────────────────────────────────

export async function updateBayCount(
  db: SupabaseClient,
  orgId: string,
  count: number,
): Promise<number> {
  if (count < 1 || count > 50)
    throw new ValidationError("Bay count must be between 1 and 50");

  // Get current branch settings
  const { data: branch, error: branchErr } = await db
    .from("branches")
    .select("id, settings")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .single();
  if (branchErr) capture(branchErr, { context: "[bay-view-service] updateBayCount" });

  if (!branch) throw new NotFoundError("Main branch not found");

  const currentSettings =
    (branch.settings as unknown as Record<string, unknown>) ?? {};
  const oldCount = (currentSettings.bay_count as number) ?? 6;

  // If reducing bay count, unassign vehicles from removed bays
  if (count < oldCount) {
    const { error: unassignErr } = await db
      .from("work_orders")
      .update({
        bay_number: null,
        status: "New" as const,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .gt("bay_number", count)
      .not("status", "in", '("Completed","Cancelled")')
      .is("deleted_at", null);
    if (unassignErr) capture(unassignErr, { context: "[bay-view-service] updateBayCount" });
  }

  const newSettings = { ...currentSettings, bay_count: count };

  const { error } = await db
    .from("branches")
    .update({ settings: newSettings, updated_at: new Date().toISOString() })
    .eq("id", branch.id);

  if (error) {
    capture(error, { context: "[bay-view-service] updateBayCount" });
    throw new Error(error.message ?? "Failed to update bay count");
  }

  return count;
}

// ── Seed Waiting Queue ─────────────────────────────────────────

export async function seedWaitingQueue(
  db: SupabaseClient,
  orgId: string,
  userId: string,
): Promise<{
  created: number;
  errors: string[];
}> {
  const { data: branch, error: branchErr } = await db
    .from("branches")
    .select("id")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();
  if (branchErr) capture(branchErr, { context: "[bay-view-service] seedWaitingQueue" });
  if (!branch) throw new Error("Branch not found");

  const SEED_VEHICLES = [
    {
      make: "Toyota",
      model: "Prius",
      plate: "01-01-УБО",
      year: 2020,
      owner: "Bat Erdene",
      phone: "99110001",
    },
    {
      make: "Toyota",
      model: "Land Cruiser 200",
      plate: "01-02-УБН",
      year: 2022,
      owner: "Sukhbold",
      phone: "99110002",
    },
    {
      make: "Honda",
      model: "Fit",
      plate: "01-03-УБЦ",
      year: 2019,
      owner: "Tsetseg Baatar",
      phone: "99110003",
    },
    {
      make: "Hyundai",
      model: "Santa Fe",
      plate: "01-04-УБӨ",
      year: 2021,
      owner: "Gan Zorig",
      phone: "99110004",
    },
    {
      make: "Lexus",
      model: "RX 350",
      plate: "01-05-УБХ",
      year: 2023,
      owner: "Enkh Tuvshin",
      phone: "99110005",
    },
    {
      make: "Kia",
      model: "Sorento",
      plate: "01-06-УБЯ",
      year: 2022,
      owner: "Dash Purev",
      phone: "99110006",
    },
    {
      make: "Mercedes",
      model: "GLC 300",
      plate: "01-07-УБЭ",
      year: 2021,
      owner: "Odkoo Dorj",
      phone: "99110007",
    },
    {
      make: "BMW",
      model: "X5",
      plate: "01-08-УБШ",
      year: 2023,
      owner: "Naraa Batzorig",
      phone: "99110008",
    },
    {
      make: "Nissan",
      model: "Navara",
      plate: "01-09-УБЧ",
      year: 2020,
      owner: "Bayarsaikhan",
      phone: "99110009",
    },
    {
      make: "Mazda",
      model: "CX-5",
      plate: "01-10-УБЗ",
      year: 2022,
      owner: "Tuya Chimed",
      phone: "99110010",
    },
    {
      make: "Land",
      model: "Range Rover Sport",
      plate: "01-11-УБҮ",
      year: 2023,
      owner: "Zolboo Davaa",
      phone: "99110011",
    },
    {
      make: "Toyota",
      model: "Hiace",
      plate: "01-12-УБФ",
      year: 2021,
      owner: "Amar Ganbold",
      phone: "99110012",
    },
  ];

  const SERVICES = [
    "Oil change & filter",
    "Brake pad replacement",
    "Tire rotation & balance",
    "Engine diagnostic",
    "Transmission fluid change",
    "AC recharge & service",
    "Timing belt replacement",
    "Suspension check",
    "Wheel alignment",
    "Battery replacement",
    "Coolant flush",
    "Spark plug replacement",
  ];

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < SEED_VEHICLES.length; i++) {
    const v = SEED_VEHICLES[i];
    const svc = SERVICES[i];

    try {
      // Find or create customer
      let custId: string;
      const { data: existingCust, error: existingCustErr } = await db
        .from("customers")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone", v.phone)
        .is("deleted_at", null)
        .maybeSingle();
      if (existingCustErr) capture(existingCustErr, { context: "[bay-view-service] seedWaitingQueue" });

      if (existingCust) {
        custId = existingCust.id;
      } else {
        const [first, ...rest] = v.owner.split(" ");
        const { data: newCust, error: newCustErr } = await db
          .from("customers")
          .insert({
            organization_id: orgId,
            branch_id: branch.id,
            first_name: first,
            last_name: rest.join(" ") || null,
            phone: v.phone,
            created_by: userId,
            updated_by: userId,
          })
          .select("id")
          .single();
        if (!newCust) throw new Error("customer insert returned no data");
        if (newCustErr) capture(newCustErr, { context: "[bay-view-service] seedWaitingQueue" });
        custId = newCust.id;
      }

      // Find or create vehicle
      let vehId: string;
      const { data: existingVeh, error: existingVehErr } = await db
        .from("vehicles")
        .select("id")
        .eq("organization_id", orgId)
        .eq("plate_number", v.plate)
        .is("deleted_at", null)
        .maybeSingle();
      if (existingVehErr) capture(existingVehErr, { context: "[bay-view-service] seedWaitingQueue" });

      if (existingVeh) {
        vehId = existingVeh.id;
      } else {
        const { data: newVeh, error: newVehErr } = await db
          .from("vehicles")
          .insert({
            organization_id: orgId,
            branch_id: branch.id,
            customer_id: custId,
            make: v.make,
            model: v.model,
            plate_number: v.plate,
            year: v.year,
            created_by: userId,
            updated_by: userId,
          })
          .select("id")
          .single();
        if (!newVeh) throw new Error("vehicle insert returned no data");
        if (newVehErr) capture(newVehErr, { context: "[bay-view-service] seedWaitingQueue" });
        vehId = newVeh.id;
      }

      // createWorkOrder — same RLS path as the API route (works in production)
      await createWorkOrder(db, orgId, {
        customer_id: custId,
        vehicle_id: vehId,
        branchId: branch.id,
        notes: svc,
      });

      created++;
    } catch (e) {
      errors.push(`${v.plate}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { created, errors };
}

// ── Assign Vehicle to First Available Bay ─────────────────────

export async function assignToFirstAvailableBay(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
): Promise<number> {
  // Get current bay count
  const { data: branch, error: branchErr } = await db
    .from("branches")
    .select("settings")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();
  if (branchErr) capture(branchErr, { context: "[bay-view-service] assignToFirstAvailableBay" });

  const bayCount =
    ((branch?.settings as unknown as Record<string, unknown> | null)
      ?.bay_count as number) ?? 6;

  // Find occupied bays
  const { data: active, error: activeErr } = await db
    .from("work_orders")
    .select("bay_number")
    .eq("organization_id", orgId)
    .not("status", "in", '("Completed","Cancelled")')
    .is("deleted_at", null)
    .not("bay_number", "is", null);
  if (activeErr) capture(activeErr, { context: "[bay-view-service] assignToFirstAvailableBay" });

  const occupied = new Set((active ?? []).map((w) => w.bay_number));

  // Find first empty bay
  let firstEmpty = 1;
  for (let i = 1; i <= bayCount; i++) {
    if (!occupied.has(i)) {
      firstEmpty = i;
      break;
    }
  }

  // Assign to that bay — clear old data, start fresh
  const { error } = await db
    .from("work_orders")
    .update({
      bay_number: firstEmpty,
      status: "New" as const,
      complaint: null,
      diagnosis: null,
      notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) {
    capture(error, { context: "[bay-view-service] assignToFirstAvailableBay" });
    throw new Error(error.message ?? "Failed to assign vehicle to bay");
  }

  // Clear old services and parts
  await Promise.all([
    (async () => {
      const { error: deleteErr } = await db.from("work_order_services").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] assignToFirstAvailableBay" });
    })(),
    (async () => {
      const { error: deleteErr } = await db.from("work_order_parts").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] assignToFirstAvailableBay" });
    })(),
    (async () => {
      const { error: deleteErr } = await db.from("work_order_helpers").delete().eq("work_order_id", workOrderId);
      if (deleteErr) capture(deleteErr, { context: "[bay-view-service] assignToFirstAvailableBay" });
    })(),
  ]);

  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  return firstEmpty;
}

// ── Reorder Waiting Queue ────────────────────────────────────

export async function reorderQueue(
  db: SupabaseClient,
  orgId: string,
  updates: { id: string; queue_order: number }[],
): Promise<void> {
  await Promise.all(
    updates.map(async (u) => {
      const { error } = await db
        .from("work_orders")
        .update({
          queue_order: u.queue_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", u.id)
        .eq("organization_id", orgId);

      if (error) {
        capture(error, { context: "[bay-view-service] reorderQueue" });
        throw new Error(error.message ?? "Failed to reorder queue");
      }
    }),
  );
}

// ── Shift Report ─────────────────────────────────────────────

export async function getShiftReport(
  db: SupabaseClient,
  orgId: string,
  branchId?: string,
): Promise<ShiftReport> {
  // Get bay count from selected branch or main branch
  const branchQuery = db
    .from("branches")
    .select("settings")
    .eq("organization_id", orgId);
  if (branchId) {
    branchQuery.eq("id", branchId);
  } else {
    branchQuery.eq("is_main", true);
  }
  const { data: branch, error: branchErr } = await branchQuery.maybeSingle();
  if (branchErr) capture(branchErr, { context: "[bay-view-service] getShiftReport" });

  const bayCount =
    ((branch?.settings as unknown as Record<string, unknown> | null)
      ?.bay_count as number) ?? 6;

  // Today's completed work orders + active + in-bay (parallel)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: completed, error: completedErr }, { data: active, error: activeErr }, { count: inBayCount, error: inBayErr }] =
    await Promise.all([
      // Completed jobs today — fetch totals + timestamps for revenue & duration
      withBranchFilter(
        db
          .from("work_orders")
          .select("total, completed_at, started_at")
          .eq("organization_id", orgId)
          .eq("status", "Completed")
          .gte("completed_at", todayStart.toISOString())
          .is("deleted_at", null),
        branchId,
      ),
      // Active jobs — fetch started_at for elapsed-time computation
      withBranchFilter(
        db
          .from("work_orders")
          .select("id, started_at")
          .eq("organization_id", orgId)
          .not("status", "in", '("Completed","Cancelled")')
          .is("deleted_at", null),
        branchId,
      ),
      // In-bay jobs — count only (no row data needed)
      withBranchFilter(
        db
          .from("work_orders")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .not("status", "in", '("Completed","Cancelled")')
          .is("deleted_at", null)
          .not("bay_number", "is", null),
        branchId,
      ),
    ]);
  if (completedErr) capture(completedErr, { context: "[bay-view-service] getShiftReport" });
  if (activeErr) capture(activeErr, { context: "[bay-view-service] getShiftReport" });
  if (inBayErr) capture(inBayErr, { context: "[bay-view-service] getShiftReport" });

  const completedToday = completed?.length ?? 0;
  const revenueToday =
    completed?.reduce((sum, wo) => sum + Number(wo.total), 0) ?? 0;

  // Single pass over completed: avg duration + total labor minutes
  let completedLaborMinutes = 0;
  let avgDurationMinutes = 0;
  if (completed && completedToday > 0) {
    let totalDurationMinutes = 0;
    for (const wo of completed) {
      if (!wo.started_at || !wo.completed_at) continue;
      const diffMs =
        new Date(wo.completed_at).getTime() - new Date(wo.started_at).getTime();
      const mins = Math.round(diffMs / 60000);
      if (Number.isFinite(mins) && mins > 0) {
        totalDurationMinutes += mins;
        completedLaborMinutes += mins;
      }
    }
    avgDurationMinutes = Math.round(totalDurationMinutes / completedToday);
  }

  const activeJobs = active?.length ?? 0;

  // Elapsed time for active jobs (elapsed so far today)
  let activeLaborMinutes = 0;
  if (active) {
    const now = Date.now();
    for (const wo of active) {
      if (!wo.started_at) continue;
      const mins = Math.round(
        (now - new Date(wo.started_at).getTime()) / 60000,
      );
      if (Number.isFinite(mins) && mins > 0) activeLaborMinutes += mins;
    }
  }

  const totalLaborHours = (completedLaborMinutes + activeLaborMinutes) / 60;
  const revenuePerLaborHour =
    totalLaborHours > 0 ? Math.round(revenueToday / totalLaborHours) : 0;

  const bayUtilization =
    bayCount > 0 ? Math.round(((inBayCount ?? 0) / bayCount) * 100) : 0;

  return {
    completedToday,
    revenueToday,
    avgDurationMinutes,
    bayUtilization,
    bayCount,
    activeJobs,
    revenuePerLaborHour,
  };
}

// ── Update Bay View PIN ──────────────────────────────────────

export async function updateBayViewPin(
  db: SupabaseClient,
  orgId: string,
  currentPin: string,
  newPin: string,
  confirmPin: string,
): Promise<void> {
  if (!/^[0-9]{4,6}$/.test(newPin)) {
    throw new ValidationError("PIN must be 4 to 6 digits");
  }
  if (newPin !== confirmPin) {
    throw new ValidationError("PIN confirmation does not match");
  }

  // Verify current PIN first
  const { data: verified, error: verifyErr } = await db.rpc("verify_organization_bay_view_pin", {
    target_org_id: orgId,
    plain_pin: currentPin,
  });
  if (verifyErr) capture(verifyErr, { context: "[bay-view-service] updateBayViewPin" });

  if (!verified) {
    throw new ValidationError("Current PIN is incorrect");
  }

  // Set new PIN
  const { error } = await db.rpc("set_organization_bay_view_pin", {
    target_org_id: orgId,
    plain_pin: newPin,
  });

  if (error) {
    capture(error, { context: "[bay-view-service] updateBayViewPin" });
    throw new ValidationError(error.message);
  }
}
