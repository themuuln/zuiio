"use server";

import { revalidateTag } from "next/cache";
import { cacheDurations, cacheTags } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type { Profile, Vehicle, WorkOrder } from "@/lib/types";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { createWorkOrder } from "@/lib/services/work-order-service";
import { createClient } from "@/lib/supabase/server";

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
        customer_name: string | null;
      })
    | null;
}

export interface BayViewData {
  bayCount: number;
  bays: BaySlotData[];
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

// ── Get Bay View Data ──────────────────────────────────────────

async function fetchBayViewData(orgId: string): Promise<BayViewData> {
  const supabase = await createClient();
  // Get branch with bay_count setting
  const { data: branch } = await supabase
    .from("branches")
    .select("settings")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();

  const bayCount =
    ((branch?.settings as unknown as Record<string, unknown> | null)
      ?.bay_count as number) ?? 6;

  // Get all active (non-completed/cancelled) work orders
  const { data: activeWOs } = await supabase
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
    .order("created_at", { ascending: true });

  const workOrders = activeWOs ?? [];

  // Batch-fetch mechanic profiles for all assigned mechanics
  const mechanicIds = [
    ...new Set(
      workOrders.flatMap((wo) =>
        wo.mechanic_id ? [wo.mechanic_id as string] : [],
      ),
    ),
  ];

  const mechanicMap = new Map<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }
  >();
  if (mechanicIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", mechanicIds);
    for (const p of profiles ?? []) {
      mechanicMap.set(p.id, p);
    }
  }

  // Attach mechanic info and customer name to work orders
  const woWithDetails = workOrders.map((wo) => ({
    ...wo,
    mechanic: wo.mechanic_id ? (mechanicMap.get(wo.mechanic_id) ?? null) : null,
    customer_name: wo.customer?.company_name ?? wo.customer?.full_name ?? null,
  }));

  // Separate bay-assigned vs waiting queue
  const inBay = woWithDetails.filter((wo) => wo.bay_number != null);
  const waiting = woWithDetails.filter((wo) => wo.bay_number == null);

  // Build bay slots
  const bays: BaySlotData[] = [];
  for (let i = 1; i <= bayCount; i++) {
    const wo = inBay.find((w) => w.bay_number === i) ?? null;
    bays.push({
      bayNumber: i,
      workOrder: wo as unknown as BaySlotData["workOrder"],
    });
  }

  // Get mechanics (users with mechanic role)
  const { data: mechanics } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("full_name");

  const mechList = (mechanics ?? []).map((p) => ({
    ...p,
    current_jobs: workOrders.filter((wo) => wo.mechanic_id === p.id).length,
  })) as unknown as (Profile & { current_jobs: number })[];

  return {
    bayCount,
    bays,
    waitingQueue: waiting as unknown as BayViewData["waitingQueue"],
    mechanics: mechList,
  };
}

/**
 * Cached version — good for initial load and auto-refresh polling.
 * Cache is invalidated by revalidateTag calls in mutation functions.
 */
export async function getBayViewData(): Promise<BayViewData> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const orgId = await getOrgId();

  return withCache(["getBayViewData", orgId], () => fetchBayViewData(orgId), {
    tags: [cacheTags.bayView(orgId, orgId)],
    revalidate: cacheDurations.bayView,
  });
}

/**
 * Fresh (uncached) version — call after any mutation to ensure
 * the UI sees the committed database state immediately.
 */
export async function getBayViewDataFresh(): Promise<BayViewData> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const orgId = await getOrgId();
  return fetchBayViewData(orgId);
}

// ── Assign Vehicle to Bay ─────────────────────────────────────

export async function assignVehicleToBay(
  workOrderId: string,
  bayNumber: number,
): Promise<void> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Validate bay is free
  const { data: conflict } = await supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("bay_number", bayNumber)
    .not("status", "in", '("Completed","Cancelled")')
    .is("deleted_at", null)
    .maybeSingle();

  if (conflict && conflict.id !== workOrderId) {
    throw new ValidationError(`Bay ${bayNumber} is already occupied`);
  }

  // If the target work order is currently in another bay, free that bay first
  const { data: current } = await supabase
    .from("work_orders")
    .select("bay_number")
    .eq("id", workOrderId)
    .single();

  if (current?.bay_number && current.bay_number !== bayNumber) {
    // Free the old bay (set to null first to avoid unique constraint)
    await supabase
      .from("work_orders")
      .update({ bay_number: null, updated_at: new Date().toISOString() })
      .eq("id", workOrderId);
  }

  // Assign to new bay
  const { error } = await supabase
    .from("work_orders")
    .update({
      bay_number: bayNumber,
      status: "Diagnosing" as const,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error)
    throw new Error(error.message ?? "Failed to assign vehicle to bay");

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error)
    throw new Error(error.message ?? "Failed to remove vehicle from bay");

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
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "Completed" || status === "Cancelled") {
    updates.bay_number = null;
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("work_orders")
    .update(updates)
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message ?? "Failed to update status");

  // Insert status history entry with optional notes
  if (notes) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("work_order_status_history").insert({
      work_order_id: workOrderId,
      organization_id: orgId,
      status,
      notes,
      created_by: userId,
    });
  }

  revalidateTag(cacheTags.bayView(orgId, orgId), "max");
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
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
      await createWorkOrder(orgId, {
        customer_id: custId,
        vehicle_id: vehId,
        branch_id: branch.id,
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

  // Assign to that bay
  const { error } = await supabase
    .from("work_orders")
    .update({
      bay_number: firstEmpty,
      status: "Diagnosing" as const,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) {
    throw new Error(error.message ?? "Failed to assign vehicle to bay");
  }

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

export async function getShiftReport(): Promise<ShiftReport> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new UnauthorizedError();
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Get bay count
  const { data: branch } = await supabase
    .from("branches")
    .select("settings")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();

  const bayCount =
    ((branch?.settings as unknown as Record<string, unknown> | null)
      ?.bay_count as number) ?? 6;

  // Today's completed work orders + active + in-bay (parallel)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: completed }, { data: active }, { data: inBay }] =
    await Promise.all([
      supabase
        .from("work_orders")
        .select("total, completed_at, started_at")
        .eq("organization_id", orgId)
        .eq("status", "Completed")
        .gte("completed_at", todayStart.toISOString())
        .is("deleted_at", null),
      supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .not("status", "in", '("Completed","Cancelled")')
        .is("deleted_at", null),
      supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .not("status", "in", '("Completed","Cancelled")')
        .is("deleted_at", null)
        .not("bay_number", "is", null),
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
