"use server";

import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { createWorkOrder } from "@/lib/services/work-order-service";
import { createClient } from "@/lib/supabase/server";
import { withBranchFilter } from "@/lib/supabase/with-branch";
import type { Profile, Vehicle, WorkOrder } from "@/lib/types";
import { updateWorkOrderStatus as updateWorkOrderStatusCanonical } from "./work-order-workflow";

// ── Types ──────────────────────────────────────────────────────

export interface BaySlotData {
  bayNumber: number;
  workOrder:
    | (WorkOrder & {
        vehicle: Vehicle | null;
        mechanic: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        } | null;
        helpers: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }[];
        customer_name: string | null;
      })
    | null;
}

export interface BranchInfo {
  id: string;
  name: string;
}

export interface BranchSectionData {
  branchId: string;
  branchName: string;
  bayCount: number;
  bays: BaySlotData[];
}

export interface BayViewData {
  bayCount: number;
  bays: BaySlotData[];
  branches: BranchInfo[];
  /** Present when viewing "All" — one section per branch with its bay grid. */
  branchSections?: BranchSectionData[];
  waitingQueue: (WorkOrder & {
    vehicle: Vehicle | null;
  })[];
  mechanics: (Profile & { current_jobs: number })[];
}

// ── Helpers ────────────────────────────────────────────────────

async function getOrgId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  const { data, error } = await supabase.rpc("get_user_organization_id");

  if (error) {
    throw new UnauthorizedError(error.message);
  }

  if (!data) {
    throw new UnauthorizedError("Choose an organization to continue");
  }

  return data;
}

// ── Helpers for multi-branch sections ─────────────────────────

/**
 * Build bay slot sections for each branch. Used in "All" mode to display
 * each branch's bays grouped under a branch name header.
 */
function buildBranchSections(
  woWithDetails: any[],
  allBranches: { id: string; name: string; settings: unknown }[],
): BranchSectionData[] {
  return allBranches.map((branch) => {
    const bayCount =
      ((branch.settings as Record<string, unknown> | null)
        ?.bay_count as number) ?? 6;

    // Bay-assigned work orders belonging to this branch (or legacy null)
    const branchBayWOs = woWithDetails.filter(
      (wo: any) =>
        wo.bay_number != null &&
        (wo.branch_id === branch.id || wo.branch_id === null),
    );

    const bays: BaySlotData[] = [];
    for (let i = 1; i <= bayCount; i++) {
      const wo = branchBayWOs.find((w: any) => w.bay_number === i) ?? null;
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
  orgId: string,
  branchId?: string,
): Promise<BayViewData> {
  const supabase = await createClient();

  // ── Batch 1: Independent queries (run in parallel) ──
  // branches, work_orders, and organization_users have no deps on each other
  const [{ data: allBranches }, { data: activeWOs }, memberQueryResult] =
    await Promise.all([
      // 1a. Branches (for pills, bay count, branch sections)
      supabase
        .from("branches")
        .select("id, name, settings")
        .eq("organization_id", orgId)
        .order("name"),
      // 1b. Active work orders (with vehicle + customer joins)
      supabase
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
        let q = supabase
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
    { data: helperRecords },
    { data: woMechanicProfiles },
    { data: mechProfiles },
  ] = await Promise.all([
    // 2a. Helper records (needs activeWoIds)
    activeWoIds.length > 0
      ? supabase
          .from("work_order_helpers")
          .select("work_order_id, mechanic_id")
          .in("work_order_id", activeWoIds)
      : Promise.resolve({ data: [] }),
    // 2b. Mechanic profiles for work order assignments
    mainMechanicIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", mainMechanicIds)
      : Promise.resolve({ data: [] }),
    // 2c. Mechanic profiles for mechanic panel
    mechUserIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, phone, avatar_url")
          .in("id", mechUserIds)
          .order("full_name")
      : Promise.resolve({ data: [] }),
  ]);

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
  const { data: extraProfiles } =
    extraMechIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", extraMechIds)
      : { data: [] };

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
      helpersByWo.get(h.work_order_id)!.push(profile);
    }
  }

  // Attach mechanic info, helpers, and customer name to work orders
  const woWithDetails = workOrders.map((wo) => ({
    ...wo,
    mechanic: wo.mechanic_id ? (mechanicMap.get(wo.mechanic_id) ?? null) : null,
    helpers: helpersByWo.get(wo.id) ?? [],
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

/**
 * Cached version — good for initial load and auto-refresh polling.
 * Cache is invalidated by revalidateTag calls in mutation functions.
 */
export async function getBayViewData(branchId?: string): Promise<BayViewData> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const orgId = await getOrgId();

  return fetchBayViewData(orgId, branchId);
}

/**
 * Fresh (uncached) version — call after any mutation to ensure
 * the UI sees the committed database state immediately.
 */
export async function getBayViewDataFresh(
  branchId?: string,
): Promise<BayViewData> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const orgId = await getOrgId();
  return fetchBayViewData(orgId, branchId);
}

// ── Assign Vehicle to Bay ─────────────────────────────────────

export async function assignVehicleToBay(
  workOrderId: string,
  bayNumber: number,
): Promise<void> {
  // Single supabase client — reuse for auth + all operations
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  const orgId = await getOrgId();

  // Run conflict check, clear old data, and assign in one parallel batch.
  const assignFn = async () => {
    const { error } = await supabase
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
  const [{ data: conflict }, { error: assignError }] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("bay_number", bayNumber)
      .not("status", "in", '("Completed","Cancelled")')
      .is("deleted_at", null)
      .maybeSingle(),
    assignFn(),
    supabase
      .from("work_order_helpers")
      .delete()
      .eq("work_order_id", workOrderId),
    supabase
      .from("work_order_services")
      .delete()
      .eq("work_order_id", workOrderId),
    supabase.from("work_order_parts").delete().eq("work_order_id", workOrderId),
  ]);

  if (conflict && conflict.id !== workOrderId) {
    throw new ValidationError(`Bay ${bayNumber} is already occupied`);
  }

  if (assignError)
    throw new Error(assignError.message ?? "Failed to assign vehicle to bay");

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Swap two occupied bays ─────────────────────────────────────

export async function swapBayNumbers(
  workOrderIdA: string,
  bayNumberA: number,
  workOrderIdB: string,
  bayNumberB: number,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  const orgId = await getOrgId();
  const now = new Date().toISOString();

  // Step 1: temporarily clear both bays so no conflict check fires
  const { error: clearErr } = await supabase
    .from("work_orders")
    .update({ bay_number: null, updated_at: now })
    .in("id", [workOrderIdA, workOrderIdB])
    .eq("organization_id", orgId);
  if (clearErr) throw new Error(clearErr.message ?? "Failed to swap bays");

  // Step 2: assign each vehicle to the other's bay (both bays are now free)
  const { error: swapErr } = await Promise.all([
    supabase
      .from("work_orders")
      .update({ bay_number: bayNumberA, updated_at: now })
      .eq("id", workOrderIdB)
      .eq("organization_id", orgId),
    supabase
      .from("work_orders")
      .update({ bay_number: bayNumberB, updated_at: now })
      .eq("id", workOrderIdA)
      .eq("organization_id", orgId),
  ]).then((results) => {
    const errs = results.map((r) => r.error).filter(Boolean);
    return { error: errs.length > 0 ? errs[0] : null };
  });
  if (swapErr)
    throw new Error(swapErr.message ?? "Failed to assign vehicle to bay");

  // Step 3: clean up helpers for both work orders
  await supabase
    .from("work_order_helpers")
    .delete()
    .in("work_order_id", [workOrderIdA, workOrderIdB]);

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderIdA), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderIdA), "max");
  revalidateTag(cacheTags.workOrder(workOrderIdB), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderIdB), "max");
}

// ── Remove Vehicle from Bay ───────────────────────────────────

export async function removeVehicleFromBay(workOrderId: string): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const { error } = await supabase
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

  if (error)
    throw new Error(error.message ?? "Failed to remove vehicle from bay");

  // Clear helpers, services, and parts
  await Promise.all([
    supabase
      .from("work_order_helpers")
      .delete()
      .eq("work_order_id", workOrderId),
    supabase
      .from("work_order_services")
      .delete()
      .eq("work_order_id", workOrderId),
    supabase.from("work_order_parts").delete().eq("work_order_id", workOrderId),
  ]);

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Assign Mechanic ────────────────────────────────────────────

export async function assignMechanicToWorkOrder(
  workOrderId: string,
  mechanicId: string,
): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const { error } = await supabase
    .from("work_orders")
    .update({
      mechanic_id: mechanicId,
      status: "In Progress" as const,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message ?? "Failed to assign mechanic");

  // If this mechanic was previously a helper on this WO, remove them from helpers
  await supabase
    .from("work_order_helpers")
    .delete()
    .eq("work_order_id", workOrderId)
    .eq("mechanic_id", mechanicId);

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Unassign Mechanic ─────────────────────────────────────────

export async function unassignMechanicFromWorkOrder(
  workOrderId: string,
): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const { error } = await supabase
    .from("work_orders")
    .update({
      mechanic_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message ?? "Failed to unassign mechanic");

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Assign Helper Mechanic ──────────────────────────────────────

export async function assignHelperToWorkOrder(
  workOrderId: string,
  mechanicId: string,
): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Check if this mechanic is already a helper on this WO
  const { data: existing } = await supabase
    .from("work_order_helpers")
    .select("id")
    .eq("work_order_id", workOrderId)
    .eq("mechanic_id", mechanicId)
    .maybeSingle();

  if (existing) {
    // Already assigned as helper — no-op
    return;
  }

  // Don't add as helper if they're already the main mechanic
  const { data: wo } = await supabase
    .from("work_orders")
    .select("mechanic_id")
    .eq("id", workOrderId)
    .single();

  if (wo?.mechanic_id === mechanicId) {
    return; // Already the main mechanic
  }

  const { error } = await supabase.from("work_order_helpers").insert({
    work_order_id: workOrderId,
    organization_id: orgId,
    mechanic_id: mechanicId,
    created_by: user.id,
  });

  if (error)
    throw new Error(error.message ?? "Failed to assign helper mechanic");

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Remove Helper Mechanic ──────────────────────────────────────

export async function removeHelperFromWorkOrder(
  workOrderId: string,
  mechanicId: string,
): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const { error } = await supabase
    .from("work_order_helpers")
    .delete()
    .eq("work_order_id", workOrderId)
    .eq("mechanic_id", mechanicId);

  if (error)
    throw new Error(error.message ?? "Failed to remove helper mechanic");

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Clear All Helpers from Work Order ──────────────────────────

export async function clearHelpersFromWorkOrder(
  workOrderId: string,
): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  await supabase
    .from("work_order_helpers")
    .delete()
    .eq("work_order_id", workOrderId);

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
}

// ── Update Work Order Status ───────────────────────────────────

export type UpdateStatusParams = {
  woId: string;
  status:
    | "New"
    | "Diagnosing"
    | "In Progress"
    | "Ready for Pickup"
    | "Completed"
    | "Cancelled";
  notes?: string;
};

/**
 * Server-action wrapper that delegates to the canonical updateWorkOrderStatus
 * in work-order-workflow.ts. This ensures inventory deduction, schedule sync,
 * and full cache invalidation (dashboardMetrics, reports) run on status change.
 */
export async function updateWorkOrderStatus(
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
  const supabase = await createClient();
  const orgId = await getOrgId();
  await updateWorkOrderStatusCanonical(
    supabase,
    workOrderId,
    orgId,
    status,
    notes,
  );
}

// ── Update Bay Count ───────────────────────────────────────────

export async function updateBayCount(count: number): Promise<number> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  if (count < 1 || count > 50)
    throw new ValidationError("Bay count must be between 1 and 50");

  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Get current branch settings
  const { data: branch } = await supabase
    .from("branches")
    .select("id, settings")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .single();

  if (!branch) throw new NotFoundError("Main branch not found");

  const currentSettings =
    (branch.settings as unknown as Record<string, unknown>) ?? {};
  const oldCount = (currentSettings.bay_count as number) ?? 6;

  // If reducing bay count, unassign vehicles from removed bays
  if (count < oldCount) {
    await supabase
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
  }

  const newSettings = { ...currentSettings, bay_count: count };

  const { error } = await supabase
    .from("branches")
    .update({ settings: newSettings, updated_at: new Date().toISOString() })
    .eq("id", branch.id);

  if (error) throw new Error(error.message ?? "Failed to update bay count");

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  return count;
}

// ── Seed Waiting Queue ─────────────────────────────────────────

export async function seedWaitingQueue(): Promise<{
  created: number;
  errors: string[];
}> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();
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
      const { data: existingCust } = await supabase
        .from("customers")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone", v.phone)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingCust) {
        custId = existingCust.id;
      } else {
        const [first, ...rest] = v.owner.split(" ");
        const { data: newCust } = await supabase
          .from("customers")
          .insert({
            organization_id: orgId,
            branch_id: branch.id,
            first_name: first,
            last_name: rest.join(" ") || null,
            phone: v.phone,
            created_by: user.id,
            updated_by: user.id,
          })
          .select("id")
          .single();
        if (!newCust) throw new Error("customer insert returned no data");
        custId = newCust.id;
      }

      // Find or create vehicle
      let vehId: string;
      const { data: existingVeh } = await supabase
        .from("vehicles")
        .select("id")
        .eq("organization_id", orgId)
        .eq("plate_number", v.plate)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingVeh) {
        vehId = existingVeh.id;
      } else {
        const { data: newVeh } = await supabase
          .from("vehicles")
          .insert({
            organization_id: orgId,
            branch_id: branch.id,
            customer_id: custId,
            make: v.make,
            model: v.model,
            plate_number: v.plate,
            year: v.year,
            created_by: user.id,
            updated_by: user.id,
          })
          .select("id")
          .single();
        if (!newVeh) throw new Error("vehicle insert returned no data");
        vehId = newVeh.id;
      }

      // createWorkOrder — same RLS path as the API route (works in production)
      await createWorkOrder(supabase, orgId, {
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

  // Invalidate bay view cache so the UI picks up the new queue entries
  revalidateTag(cacheTags.bayView(orgId, orgId), "max");

  return { created, errors };
}

// ── Assign Vehicle to First Available Bay ─────────────────────

export async function assignToFirstAvailableBay(
  workOrderId: string,
): Promise<number> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Get current bay count
  const { data: branch } = await supabase
    .from("branches")
    .select("settings")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();

  const bayCount =
    ((branch?.settings as unknown as Record<string, unknown> | null)
      ?.bay_count as number) ?? 6;

  // Find occupied bays
  const { data: active } = await supabase
    .from("work_orders")
    .select("bay_number")
    .eq("organization_id", orgId)
    .not("status", "in", '("Completed","Cancelled")')
    .is("deleted_at", null)
    .not("bay_number", "is", null);

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
  const { error } = await supabase
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
    throw new Error(error.message ?? "Failed to assign vehicle to bay");
  }

  // Clear old services and parts
  await Promise.all([
    supabase
      .from("work_order_services")
      .delete()
      .eq("work_order_id", workOrderId),
    supabase.from("work_order_parts").delete().eq("work_order_id", workOrderId),
    supabase
      .from("work_order_helpers")
      .delete()
      .eq("work_order_id", workOrderId),
  ]);

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  return firstEmpty;
}

// ── Reorder Waiting Queue ────────────────────────────────────

export async function reorderQueue(
  updates: { id: string; queue_order: number }[],
): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  await Promise.all(
    updates.map(async (u) => {
      const { error } = await supabase
        .from("work_orders")
        .update({
          queue_order: u.queue_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", u.id)
        .eq("organization_id", orgId);

      if (error) {
        throw new Error(error.message ?? "Failed to reorder queue");
      }
    }),
  );

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
}

// ── Shift Report ─────────────────────────────────────────────

export interface ShiftReport {
  completedToday: number;
  revenueToday: number;
  avgDurationMinutes: number;
  bayUtilization: number;
  bayCount: number;
  activeJobs: number;
}

export async function getShiftReport(branchId?: string): Promise<ShiftReport> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Get bay count from selected branch or main branch
  const branchQuery = supabase
    .from("branches")
    .select("settings")
    .eq("organization_id", orgId);
  if (branchId) {
    branchQuery.eq("id", branchId);
  } else {
    branchQuery.eq("is_main", true);
  }
  const { data: branch } = await branchQuery.maybeSingle();

  const bayCount =
    ((branch?.settings as unknown as Record<string, unknown> | null)
      ?.bay_count as number) ?? 6;

  // Today's completed work orders + active + in-bay (parallel)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: completed }, { data: active }, { data: inBay }] =
    await Promise.all([
      withBranchFilter(
        supabase
          .from("work_orders")
          .select("total, completed_at, started_at")
          .eq("organization_id", orgId)
          .eq("status", "Completed")
          .gte("completed_at", todayStart.toISOString())
          .is("deleted_at", null),
        branchId,
      ),
      withBranchFilter(
        supabase
          .from("work_orders")
          .select("id")
          .eq("organization_id", orgId)
          .not("status", "in", '("Completed","Cancelled")')
          .is("deleted_at", null),
        branchId,
      ),
      withBranchFilter(
        supabase
          .from("work_orders")
          .select("id")
          .eq("organization_id", orgId)
          .not("status", "in", '("Completed","Cancelled")')
          .is("deleted_at", null)
          .not("bay_number", "is", null),
        branchId,
      ),
    ]);

  const completedToday = completed?.length ?? 0;
  const revenueToday =
    completed?.reduce((sum, wo) => sum + Number(wo.total), 0) ?? 0;

  // Average duration of completed jobs today
  let avgDurationMinutes = 0;
  if (completedToday > 0 && completed) {
    const totalMinutes = completed.reduce((sum, wo) => {
      if (!wo.started_at || !wo.completed_at) return sum;
      const start = new Date(wo.started_at).getTime();
      const end = new Date(wo.completed_at).getTime();
      return sum + Math.round((end - start) / 60000);
    }, 0);
    avgDurationMinutes = Math.round(totalMinutes / completedToday);
  }

  const activeJobs = active?.length ?? 0;

  const bayUtilization =
    bayCount > 0 ? Math.round(((inBay?.length ?? 0) / bayCount) * 100) : 0;

  return {
    completedToday,
    revenueToday,
    avgDurationMinutes,
    bayUtilization,
    bayCount,
    activeJobs,
  };
}

// ── Update Bay View PIN ──────────────────────────────────────

export async function updateBayViewPin(
  currentPin: string,
  newPin: string,
  confirmPin: string,
): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  if (!/^[0-9]{4,6}$/.test(newPin)) {
    throw new ValidationError("PIN must be 4 to 6 digits");
  }
  if (newPin !== confirmPin) {
    throw new ValidationError("PIN confirmation does not match");
  }

  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Verify current PIN first
  const { data: verified } = await supabase.rpc(
    "verify_organization_bay_view_pin",
    {
      target_org_id: orgId,
      plain_pin: currentPin,
    },
  );

  if (!verified) {
    throw new ValidationError("Current PIN is incorrect");
  }

  // Set new PIN
  const { error } = await supabase.rpc("set_organization_bay_view_pin", {
    target_org_id: orgId,
    plain_pin: newPin,
  });

  if (error) {
    throw new ValidationError(error.message);
  }
}
