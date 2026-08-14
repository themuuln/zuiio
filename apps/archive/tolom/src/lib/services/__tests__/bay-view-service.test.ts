import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

// ── Module-level mocks ────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    workOrder: (id: string) => `work-order:${id}`,
    workOrderDetail: (id: string) => `work-order-detail:${id}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  ForbiddenError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ForbiddenError";
    }
  },
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((q: unknown) => q),
}));
vi.mock("@/lib/services/work-order-service", () => ({
  createWorkOrder: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/work-order-workflow", () => ({
  updateWorkOrderStatus: vi.fn().mockResolvedValue(undefined),
}));

import { revalidateTag } from "next/cache";
import { capture } from "@/lib/capture";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import { createWorkOrder } from "@/lib/services/work-order-service";
import { updateWorkOrderStatus as updateWorkOrderStatusCanonical } from "@/lib/services/work-order-workflow";
import { withBranchFilter } from "@/lib/supabase/with-branch";
import {
  assignHelperToWorkOrder,
  assignMechanicToWorkOrder,
  assignToFirstAvailableBay,
  assignVehicleToBay,
  batchCompleteWorkOrders,
  clearHelpersFromWorkOrder,
  getBayViewData,
  getBayViewDataFresh,
  getShiftReport,
  removeHelperFromWorkOrder,
  removeVehicleFromBay,
  reorderQueue,
  reorderWorkOrderHelpers,
  seedWaitingQueue,
  swapBayNumbers,
  unassignMechanicFromWorkOrder,
  updateBayCount,
  updateBayViewPin,
  updateWorkOrderStatus,
} from "../bay-view-service";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockCapture = vi.mocked(capture);
const mockReportServerError = vi.mocked(reportServerError);
const mockCreateWorkOrder = vi.mocked(createWorkOrder);
const mockUpdateWorkOrderStatusCanonical = vi.mocked(
  updateWorkOrderStatusCanonical,
);
const mockWithBranchFilter = vi.mocked(withBranchFilter);

const ORG_ID = "org-1";
const WO_ID = "wo-1";

let db: MockSupabaseClient;

/** Route `.maybeSingle()` through the shared thenable qb so awaits consume __qb.resolveOnce entries. */
function routeMaybeSingleThroughQueue() {
  db.from("work_orders").maybeSingle.mockReturnValue(
    db.from("work_orders") as never,
  );
}

function makeWorkOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: WO_ID,
    organization_id: ORG_ID,
    branch_id: "branch-1",
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    status: "New",
    bay_number: 1,
    mechanic_id: "mech-1",
    queue_order: 1,
    created_at: "2026-08-06T08:00:00Z",
    started_at: null,
    completed_at: null,
    deleted_at: null,
    customer: { full_name: "John", company_name: null },
    vehicle: { plate_number: "001УБА", make: "Toyota", model: "Camry" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── getBayViewData / getBayViewDataFresh ──────────────────────────

describe("getBayViewData", () => {
  it("returns full bay view for a branch (bays, mechanics, shift report)", async () => {
    // Queue consumption order in fetchBayViewData:
    // member query (async IIFE) → branches → work_orders → completed →
    // helpers → mechanic profiles (main) → mechanic panel profiles → extra profiles
    db.__qb.resolveOnce({
      data: [{ user_id: "u1" }, { user_id: "m2" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { id: "branch-1", name: "Main Branch", settings: { bay_count: 2 } },
        { id: "branch-2", name: "Other", settings: { bay_count: 1 } },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        makeWorkOrder({
          id: "wo-1",
          bay_number: 1,
          branch_id: "branch-1",
          mechanic_id: "u1",
          started_at: "2020-01-01T00:00:00Z",
          customer: { full_name: null, company_name: "ACME" },
        }),
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [
        { work_order_id: "wo-1", mechanic_id: "m2", sort_order: 0 },
        { work_order_id: "wo-1", mechanic_id: "m2", sort_order: 1 },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "u1", full_name: "Mech One", avatar_url: null }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { id: "u1", full_name: "Panel One", phone: "9911", avatar_url: null },
        { id: "m2", full_name: "Panel Two", phone: "9922", avatar_url: null },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "m2", full_name: "Mech Two", avatar_url: null }],
      error: null,
    });

    const result = await getBayViewData(db as never, ORG_ID, "branch-1");

    expect(result.bayCount).toBe(2);
    expect(result.branches).toEqual([
      { id: "branch-1", name: "Main Branch" },
      { id: "branch-2", name: "Other" },
    ]);
    expect(result.branchSections).toBeUndefined();
    expect(result.bays).toEqual([
      { bayNumber: 1, workOrder: expect.objectContaining({ id: "wo-1" }) },
      { bayNumber: 2, workOrder: null },
    ]);
    expect(result.waitingQueue).toEqual([]);
    expect(result.mechanics).toEqual([
      {
        id: "u1",
        full_name: "Panel One",
        phone: "9911",
        avatar_url: null,
        current_jobs: 1,
      },
      {
        id: "m2",
        full_name: "Panel Two",
        phone: "9922",
        avatar_url: null,
        current_jobs: 2,
      },
    ]);
    expect(result.shiftReport).toEqual({
      completedToday: 0,
      revenueToday: 0,
      avgDurationMinutes: 0,
      bayUtilization: 50,
      bayCount: 2,
      activeJobs: 1,
      revenuePerLaborHour: 0,
    });
    // Mechanic + helper attached to the bay work order
    const wo = result.bays[0].workOrder as Record<string, unknown>;
    expect(wo.mechanic).toEqual({
      id: "u1",
      full_name: "Mech One",
      avatar_url: null,
    });
    expect(wo.helpers).toEqual([
      { id: "m2", full_name: "Mech Two", avatar_url: null },
      { id: "m2", full_name: "Mech Two", avatar_url: null },
    ]);
    expect(wo.customer_name).toBe("ACME");
    expect(mockWithBranchFilter).toHaveBeenCalledTimes(2);
    expect(mockWithBranchFilter).toHaveBeenCalledWith(
      expect.anything(),
      "branch-1",
    );
  });

  it("builds multi-branch sections in All mode incl. legacy null-branch bays and waiting queue", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [
        { id: "b1", name: "Main", settings: { bay_count: 2 } },
        { id: "b2", name: "Two", settings: { bay_count: 3 } },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        makeWorkOrder({
          id: "wo-1",
          bay_number: 1,
          branch_id: "b1",
          mechanic_id: "m1",
          customer: { full_name: "John", company_name: null },
        }),
        makeWorkOrder({
          id: "wo-2",
          bay_number: null,
          branch_id: null,
          mechanic_id: null,
          customer: { full_name: null, company_name: null },
        }),
        makeWorkOrder({
          id: "wo-3",
          bay_number: 2,
          branch_id: null,
          mechanic_id: "m1",
        }),
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    // Helper row whose mechanic IS the main mechanic — must be filtered out
    db.__qb.resolveOnce({
      data: [{ work_order_id: "wo-1", mechanic_id: "m1", sort_order: 0 }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "m1", full_name: "Mech One", avatar_url: null }],
      error: null,
    });

    const result = await getBayViewData(db as never, ORG_ID);

    // "All" view: bays from primary branch (first in list)
    expect(result.bays[0].workOrder).toEqual(
      expect.objectContaining({ id: "wo-1" }),
    );
    expect(result.bays[1].workOrder).toEqual(
      expect.objectContaining({ id: "wo-3" }),
    );
    expect(result.waitingQueue).toEqual([
      expect.objectContaining({ id: "wo-2" }),
    ]);
    // Legacy null-branch WO appears under both branch sections
    expect(result.branchSections).toEqual([
      {
        branchId: "b1",
        branchName: "Main",
        bayCount: 2,
        bays: [
          { bayNumber: 1, workOrder: expect.objectContaining({ id: "wo-1" }) },
          { bayNumber: 2, workOrder: expect.objectContaining({ id: "wo-3" }) },
        ],
      },
      {
        branchId: "b2",
        branchName: "Two",
        bayCount: 3,
        bays: [
          { bayNumber: 1, workOrder: null },
          { bayNumber: 2, workOrder: expect.objectContaining({ id: "wo-3" }) },
          { bayNumber: 3, workOrder: null },
        ],
      },
    ]);
    // Helper equal to main mechanic is de-duplicated
    const wo1 = result.bays[0].workOrder as Record<string, unknown>;
    expect(wo1.helpers).toEqual([]);
  });

  it("defaults bay count when branches are missing for a requested branch", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: null }); // branches → null
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getBayViewData(db as never, ORG_ID, "branch-1");

    expect(result.bayCount).toBe(6);
    expect(result.branches).toEqual([]);
    expect(result.bays).toHaveLength(6);
  });

  it("returns empty structure when no data", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getBayViewData(db as never, ORG_ID);

    expect(result.bayCount).toBe(6);
    expect(result.bays).toHaveLength(6);
    expect(result.bays.every((b) => b.workOrder === null)).toBe(true);
    expect(result.branches).toEqual([]);
    expect(result.branchSections).toEqual([]);
    expect(result.waitingQueue).toEqual([]);
    expect(result.mechanics).toEqual([]);
    expect(result.shiftReport).toEqual({
      completedToday: 0,
      revenueToday: 0,
      avgDurationMinutes: 0,
      bayUtilization: 0,
      bayCount: 6,
      activeJobs: 0,
      revenuePerLaborHour: 0,
    });
  });

  it("computes shift report aggregation from completed data", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [{ id: "b1", name: "Main", settings: { bay_count: 4 } }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        makeWorkOrder({
          id: "wo-1",
          bay_number: null,
          mechanic_id: null,
          started_at: "not-a-date",
        }),
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        {
          total: 100,
          started_at: "2026-08-06T09:00:00Z",
          completed_at: "2026-08-06T10:00:00Z",
        },
        { total: 50, started_at: null, completed_at: "2026-08-06T11:00:00Z" },
        {
          total: 150,
          started_at: "2026-08-06T10:00:00Z",
          completed_at: "2026-08-06T09:00:00Z",
        },
        {
          total: 200,
          started_at: "2026-08-06T08:00:00Z",
          completed_at: "2026-08-06T09:30:00Z",
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // helpers → null data

    const result = await getBayViewData(db as never, ORG_ID);

    // 2 valid durations (60 + 90 min); 2 skipped (no started_at, negative)
    expect(result.shiftReport).toEqual({
      completedToday: 4,
      revenueToday: 500,
      avgDurationMinutes: 38, // round(150 / 4)
      bayUtilization: 0,
      bayCount: 4,
      activeJobs: 1,
      revenuePerLaborHour: 200, // 500 / 2.5 labor hours
    });
  });

  it("throws ForbiddenError when a query fails with permission code 42501", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const p = getBayViewData(db as never, ORG_ID);
    await expect(p).rejects.toThrow(ForbiddenError);
    await expect(p).rejects.toThrow(
      "Your role doesn't have access to view bay view data",
    );
  });

  it("captures non-permission query errors and falls back to empty data", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("boom") });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getBayViewData(db as never, ORG_ID);

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] fetchBayViewData",
    });
    expect(result.bayCount).toBe(6);
    expect(result.bays).toHaveLength(6);
  });

  it("captures errors on the remaining batch-1 queries (active, completed, members)", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("member boom") });
    db.__qb.resolveOnce({
      data: [{ id: "b1", name: "Main", settings: { bay_count: 0 } }],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: new Error("active boom") });
    db.__qb.resolveOnce({ data: null, error: new Error("completed boom") });

    const result = await getBayViewData(db as never, ORG_ID);

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] fetchBayViewData",
    });
    expect(mockCapture).toHaveBeenCalledTimes(3);
    expect(result.bayCount).toBe(0);
    expect(result.bays).toEqual([]);
    expect(result.waitingQueue).toEqual([]);
  });

  it("captures batch-2 helper query errors and throws ForbiddenError on 42501", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [{ id: "b1", name: "Main", settings: {} }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        makeWorkOrder({ id: "wo-1", bay_number: null, mechanic_id: null }),
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: null,
      error: { code: "42501", message: "denied" },
    });

    const p = getBayViewData(db as never, ORG_ID);
    await expect(p).rejects.toThrow(ForbiddenError);
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Object), {
      context: "[bay-view-service] fetchBayViewData",
    });
  });

  it("captures batch-2 profile query errors and falls back gracefully", async () => {
    db.__qb.resolveOnce({ data: [{ user_id: "u1" }], error: null });
    db.__qb.resolveOnce({
      data: [{ id: "b1", name: "Main", settings: {} }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        makeWorkOrder({ id: "wo-1", bay_number: null, mechanic_id: "m1" }),
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [{ work_order_id: "wo-1", mechanic_id: "m2", sort_order: 0 }],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: new Error("main profiles boom") });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("panel profiles boom"),
    });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("extra profiles boom"),
    });

    const result = await getBayViewData(db as never, ORG_ID);

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] fetchBayViewData",
    });
    expect(mockCapture).toHaveBeenCalledTimes(3);
    // Profiles missing → mechanic info dropped, helpers without profile dropped
    expect(result.mechanics).toEqual([]);
    const wo = result.waitingQueue[0] as Record<string, unknown>;
    expect(wo.mechanic).toBeNull();
    expect(wo.helpers).toEqual([]);
  });
});

describe("getBayViewDataFresh", () => {
  it("returns bay view data (same fetch path)", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [{ id: "branch-1", name: "B1", settings: { bay_count: 3 } }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getBayViewDataFresh(db as never, ORG_ID, "branch-1");

    expect(result.bayCount).toBe(3);
    expect(result.bays).toHaveLength(3);
    expect(result.branches).toEqual([{ id: "branch-1", name: "B1" }]);
  });
});

// ── assignVehicleToBay ────────────────────────────────────────────

describe("assignVehicleToBay", () => {
  it("assigns vehicle when bay is free and clears stale data", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignVehicleToBay(db as never, ORG_ID, WO_ID, 3),
    ).resolves.toBeUndefined();

    expect(db.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({
        bay_number: 3,
        status: "New",
        complaint: null,
      }),
    );
    expect(db.from("work_orders").update).toHaveBeenCalledTimes(1);
    expect(db.from("work_order_helpers").delete).toHaveBeenCalled();
    expect(db.from("work_order_services").delete).toHaveBeenCalled();
    expect(db.from("work_order_parts").delete).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith("work-order:wo-1", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "work-order-detail:wo-1",
      "max",
    );
  });

  it("throws ValidationError when bay is occupied by another work order", async () => {
    routeMaybeSingleThroughQueue();
    // Queue consumption order: update → delHelpers → delServices → delParts → conflict
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: { id: "wo-other" }, error: null });

    const p = assignVehicleToBay(db as never, ORG_ID, WO_ID, 3);
    await expect(p).rejects.toThrow(ValidationError);
    await expect(p).rejects.toThrow("Bay 3 is already occupied");
  });

  it("captures and throws on update error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("update failed") });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignVehicleToBay(db as never, ORG_ID, WO_ID, 3),
    ).rejects.toThrow("update failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] assignVehicleToBay",
    });
  });

  it("captures stale-data delete and conflict-query errors without failing", async () => {
    routeMaybeSingleThroughQueue();
    // Order: update → delHelpers → delServices → delParts → conflict
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("helpers del") });
    db.__qb.resolveOnce({ data: null, error: new Error("services del") });
    db.__qb.resolveOnce({ data: null, error: new Error("parts del") });
    db.__qb.resolveOnce({ data: null, error: new Error("conflict check") });

    await expect(
      assignVehicleToBay(db as never, ORG_ID, WO_ID, 3),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] assignVehicleToBay",
    });
    expect(mockCapture).toHaveBeenCalledTimes(4);
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("falls back to generic message when update error has no message", async () => {
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignVehicleToBay(db as never, ORG_ID, WO_ID, 3),
    ).rejects.toThrow("Failed to assign vehicle to bay");
  });
});

// ── swapBayNumbers ────────────────────────────────────────────────

describe("swapBayNumbers", () => {
  it("swaps both work orders and cleans up helpers", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      swapBayNumbers(db as never, ORG_ID, "wo-a", 1, "wo-b", 2),
    ).resolves.toBeUndefined();

    expect(db.from("work_orders").update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ bay_number: 2 }),
    );
    expect(db.from("work_orders").update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ bay_number: 1 }),
    );
    expect(db.from("work_order_helpers").delete).toHaveBeenCalled();
    expect(db.from("work_order_helpers").delete().in).toHaveBeenCalledWith(
      "work_order_id",
      ["wo-a", "wo-b"],
    );
    expect(mockRevalidateTag).toHaveBeenCalledTimes(4);
  });

  it("throws when first update fails", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("swap A failed") });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      swapBayNumbers(db as never, ORG_ID, "wo-a", 1, "wo-b", 2),
    ).rejects.toThrow("swap A failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] swapBayNumbers",
    });
  });

  it("throws when second update fails", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("swap B failed") });

    await expect(
      swapBayNumbers(db as never, ORG_ID, "wo-a", 1, "wo-b", 2),
    ).rejects.toThrow("swap B failed");
  });

  it("captures helper cleanup errors after a successful swap", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("helpers del") });

    await expect(
      swapBayNumbers(db as never, ORG_ID, "wo-a", 1, "wo-b", 2),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] swapBayNumbers",
    });
    expect(mockRevalidateTag).toHaveBeenCalledTimes(4);
  });

  it("falls back to generic message when both errors lack messages", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      swapBayNumbers(db as never, ORG_ID, "wo-a", 1, "wo-b", 2),
    ).rejects.toThrow("Failed to swap bays");
  });
});

// ── removeVehicleFromBay ──────────────────────────────────────────

describe("removeVehicleFromBay", () => {
  it("clears bay, mechanic and stale rows", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      removeVehicleFromBay(db as never, ORG_ID, WO_ID),
    ).resolves.toBeUndefined();

    expect(db.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({
        bay_number: null,
        mechanic_id: null,
        status: "New",
      }),
    );
    expect(db.from("work_order_helpers").delete).toHaveBeenCalled();
    expect(db.from("work_order_services").delete).toHaveBeenCalled();
    expect(db.from("work_order_parts").delete).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("throws and captures on update error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("remove failed") });

    await expect(
      removeVehicleFromBay(db as never, ORG_ID, WO_ID),
    ).rejects.toThrow("remove failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] removeVehicleFromBay",
    });
  });

  it("captures stale-data delete errors and still invalidates cache", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("helpers del") });
    db.__qb.resolveOnce({ data: null, error: new Error("services del") });
    db.__qb.resolveOnce({ data: null, error: new Error("parts del") });

    await expect(
      removeVehicleFromBay(db as never, ORG_ID, WO_ID),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] removeVehicleFromBay",
    });
    expect(mockCapture).toHaveBeenCalledTimes(3);
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("falls back to generic message when update error has no message", async () => {
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      removeVehicleFromBay(db as never, ORG_ID, WO_ID),
    ).rejects.toThrow("Failed to remove vehicle from bay");
  });
});

// ── assignMechanicToWorkOrder ─────────────────────────────────────

describe("assignMechanicToWorkOrder", () => {
  it("assigns mechanic, removes them from helpers, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignMechanicToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2"),
    ).resolves.toBeUndefined();

    expect(db.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({ mechanic_id: "mech-2", status: "In Progress" }),
    );
    expect(db.from("work_order_helpers").delete).toHaveBeenCalled();
    expect(db.from("work_order_helpers").delete().eq).toHaveBeenCalledWith(
      "mechanic_id",
      "mech-2",
    );
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("throws and captures on update error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("assign failed") });

    await expect(
      assignMechanicToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2"),
    ).rejects.toThrow("assign failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] assignMechanicToWorkOrder",
    });
  });

  it("captures helper-removal errors and still invalidates cache", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("helpers del") });

    await expect(
      assignMechanicToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2"),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] assignMechanicToWorkOrder",
    });
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("falls back to generic message when update error has no message", async () => {
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      assignMechanicToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2"),
    ).rejects.toThrow("Failed to assign mechanic");
  });
});

// ── unassignMechanicFromWorkOrder ─────────────────────────────────

describe("unassignMechanicFromWorkOrder", () => {
  it("promotes the first helper to lead mechanic", async () => {
    db.__qb.resolveOnce({
      data: [{ mechanic_id: "mech-2" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      unassignMechanicFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).resolves.toBeUndefined();

    expect(db.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({ mechanic_id: "mech-2" }),
    );
    expect(db.from("work_order_helpers").delete).toHaveBeenCalled();
    expect(db.from("work_order_helpers").delete().eq).toHaveBeenCalledWith(
      "mechanic_id",
      "mech-2",
    );
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("throws when promotion update fails", async () => {
    db.__qb.resolveOnce({ data: [{ mechanic_id: "mech-2" }], error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("promote failed") });

    await expect(
      unassignMechanicFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).rejects.toThrow("promote failed");
  });

  it("clears mechanic when no helpers exist", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      unassignMechanicFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).resolves.toBeUndefined();

    expect(db.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({ mechanic_id: null }),
    );
  });

  it("throws and captures when clearing mechanic fails", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("unassign failed") });

    await expect(
      unassignMechanicFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).rejects.toThrow("unassign failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] unassignMechanicFromWorkOrder",
    });
  });

  it("captures helper-fetch errors and falls back to clearing the mechanic", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("helpers fetch") });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      unassignMechanicFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] unassignMechanicFromWorkOrder:fetchHelpers",
    });
    expect(db.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({ mechanic_id: null }),
    );
  });

  it("captures promoted-helper removal errors", async () => {
    db.__qb.resolveOnce({ data: [{ mechanic_id: "mech-2" }], error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("remove helper") });

    await expect(
      unassignMechanicFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] unassignMechanicFromWorkOrder:removeHelper",
    });
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("falls back to generic message when promotion fails without a message", async () => {
    db.__qb.resolveOnce({ data: [{ mechanic_id: "mech-2" }], error: null });
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      unassignMechanicFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).rejects.toThrow("Failed to promote helper");
  });

  it("falls back to generic message when clearing fails without a message", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      unassignMechanicFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).rejects.toThrow("Failed to unassign mechanic");
  });
});

// ── assignHelperToWorkOrder ───────────────────────────────────────

describe("assignHelperToWorkOrder", () => {
  it("inserts helper when not already assigned", async () => {
    // default maybeSingle → no existing helper, no main mechanic
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignHelperToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2", "user-1"),
    ).resolves.toBeUndefined();

    expect(db.from("work_order_helpers").insert).toHaveBeenCalledWith({
      work_order_id: WO_ID,
      organization_id: ORG_ID,
      mechanic_id: "mech-2",
      created_by: "user-1",
    });
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("no-ops when mechanic is already a helper", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "h-1" }, error: null });

    await expect(
      assignHelperToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2", "user-1"),
    ).resolves.toBeUndefined();

    expect(db.from("work_order_helpers").insert).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("no-ops when mechanic is already the main mechanic", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: { mechanic_id: "mech-2" }, error: null });

    await expect(
      assignHelperToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2", "user-1"),
    ).resolves.toBeUndefined();

    expect(db.from("work_order_helpers").insert).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("throws and captures on insert error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("insert failed") });

    await expect(
      assignHelperToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2", "user-1"),
    ).rejects.toThrow("insert failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] assignHelperToWorkOrder",
    });
  });

  it("captures lookup errors and still inserts the helper", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: null, error: new Error("existing check") });
    db.__qb.resolveOnce({ data: null, error: new Error("work order fetch") });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignHelperToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2", "user-1"),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledTimes(2);
    expect(db.from("work_order_helpers").insert).toHaveBeenCalledWith(
      expect.objectContaining({ mechanic_id: "mech-2" }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("falls back to generic message when insert error has no message", async () => {
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      assignHelperToWorkOrder(db as never, ORG_ID, WO_ID, "mech-2", "user-1"),
    ).rejects.toThrow("Failed to assign helper mechanic");
  });
});

// ── removeHelperFromWorkOrder ─────────────────────────────────────

describe("removeHelperFromWorkOrder", () => {
  it("removes helper and invalidates cache", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      removeHelperFromWorkOrder(db as never, ORG_ID, WO_ID, "mech-2"),
    ).resolves.toBeUndefined();

    expect(db.from("work_order_helpers").delete).toHaveBeenCalled();
    expect(db.from("work_order_helpers").delete().eq).toHaveBeenCalledWith(
      "mechanic_id",
      "mech-2",
    );
    expect(db.from("work_order_helpers").delete().eq).toHaveBeenCalledWith(
      "organization_id",
      ORG_ID,
    );
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("throws and captures on delete error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("delete failed") });

    await expect(
      removeHelperFromWorkOrder(db as never, ORG_ID, WO_ID, "mech-2"),
    ).rejects.toThrow("delete failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] removeHelperFromWorkOrder",
    });
  });

  it("falls back to generic message when delete error has no message", async () => {
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      removeHelperFromWorkOrder(db as never, ORG_ID, WO_ID, "mech-2"),
    ).rejects.toThrow("Failed to remove helper mechanic");
  });
});

// ── reorderWorkOrderHelpers ───────────────────────────────────────

describe("reorderWorkOrderHelpers", () => {
  it("updates sort_order per ordered mechanic ids, skipping unknowns", async () => {
    db.__qb.resolveOnce({
      data: [
        { id: "h-1", mechanic_id: "mech-1" },
        { id: "h-2", mechanic_id: "mech-2" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      reorderWorkOrderHelpers(db as never, ORG_ID, WO_ID, [
        "mech-2",
        "ghost",
        "mech-1",
      ]),
    ).resolves.toBeUndefined();

    expect(db.from("work_order_helpers").update).toHaveBeenNthCalledWith(1, {
      sort_order: 0,
    });
    expect(db.from("work_order_helpers").update).toHaveBeenNthCalledWith(2, {
      sort_order: 2,
    });
    expect(db.from("work_order_helpers").update).toHaveBeenCalledTimes(2);
    expect(db.from("work_order_helpers").update().eq).toHaveBeenCalledWith(
      "id",
      "h-2",
    );
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("throws when fetching existing helpers fails", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("fetch failed") });

    await expect(
      reorderWorkOrderHelpers(db as never, ORG_ID, WO_ID, ["mech-1"]),
    ).rejects.toThrow("fetch failed");
  });

  it("throws when an update fails", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "h-1", mechanic_id: "mech-1" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: new Error("reorder failed") });

    await expect(
      reorderWorkOrderHelpers(db as never, ORG_ID, WO_ID, ["mech-1"]),
    ).rejects.toThrow("reorder failed");
  });

  it("falls back to generic messages when errors lack messages", async () => {
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      reorderWorkOrderHelpers(db as never, ORG_ID, WO_ID, ["mech-1"]),
    ).rejects.toThrow("Failed to fetch helpers");

    db.__qb.resolveOnce({
      data: [{ id: "h-1", mechanic_id: "mech-1" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      reorderWorkOrderHelpers(db as never, ORG_ID, WO_ID, ["mech-1"]),
    ).rejects.toThrow("Failed to reorder helper");
  });

  it("no-ops and invalidates cache when no existing helpers found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      reorderWorkOrderHelpers(db as never, ORG_ID, WO_ID, ["mech-1"]),
    ).resolves.toBeUndefined();

    expect(db.from("work_order_helpers").update).not.toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });
});

// ── clearHelpersFromWorkOrder ─────────────────────────────────────

describe("clearHelpersFromWorkOrder", () => {
  it("deletes all helpers and invalidates cache", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      clearHelpersFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).resolves.toBeUndefined();

    expect(db.from("work_order_helpers").delete).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("captures delete error but still invalidates cache", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("delete failed") });

    await expect(
      clearHelpersFromWorkOrder(db as never, ORG_ID, WO_ID),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] clearHelpersFromWorkOrder",
    });
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });
});

// ── updateWorkOrderStatus ─────────────────────────────────────────

describe("updateWorkOrderStatus", () => {
  it("delegates to work-order-workflow with db, woId, orgId, status, notes", async () => {
    mockUpdateWorkOrderStatusCanonical.mockResolvedValue(undefined);

    await expect(
      updateWorkOrderStatus(db as never, ORG_ID, WO_ID, "Completed", "done"),
    ).resolves.toBeUndefined();

    expect(mockUpdateWorkOrderStatusCanonical).toHaveBeenCalledWith(
      db,
      WO_ID,
      ORG_ID,
      "Completed",
      "done",
    );
  });

  it("forwards errors from the canonical workflow", async () => {
    mockUpdateWorkOrderStatusCanonical.mockRejectedValueOnce(
      new Error("workflow failed"),
    );

    await expect(
      updateWorkOrderStatus(db as never, ORG_ID, WO_ID, "Cancelled"),
    ).rejects.toThrow("workflow failed");
    expect(mockUpdateWorkOrderStatusCanonical).toHaveBeenCalledWith(
      db,
      WO_ID,
      ORG_ID,
      "Cancelled",
      undefined,
    );
  });
});

// ── batchCompleteWorkOrders ───────────────────────────────────────

describe("batchCompleteWorkOrders", () => {
  it("reports all succeeded when every update resolves", async () => {
    mockUpdateWorkOrderStatusCanonical.mockResolvedValue(undefined);

    const result = await batchCompleteWorkOrders(db as never, ORG_ID, [
      "wo-1",
      "wo-2",
    ]);

    expect(result).toEqual({ succeeded: 2, failed: 0, errors: [] });
    expect(mockUpdateWorkOrderStatusCanonical).toHaveBeenCalledWith(
      db,
      "wo-1",
      ORG_ID,
      "Completed",
    );
    expect(mockUpdateWorkOrderStatusCanonical).toHaveBeenCalledWith(
      db,
      "wo-2",
      ORG_ID,
      "Completed",
    );
  });

  it("reports per-work-order outcome on partial failure without throwing", async () => {
    mockUpdateWorkOrderStatusCanonical
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("boom"));

    const result = await batchCompleteWorkOrders(db as never, ORG_ID, [
      "wo-1",
      "wo-2",
    ]);

    expect(result).toEqual({
      succeeded: 1,
      failed: 1,
      errors: [{ woId: "wo-2", error: "boom" }],
    });
  });

  it("stringifies non-Error rejections", async () => {
    mockUpdateWorkOrderStatusCanonical.mockRejectedValueOnce("plain failure");

    const result = await batchCompleteWorkOrders(db as never, ORG_ID, ["wo-1"]);

    expect(result).toEqual({
      succeeded: 0,
      failed: 1,
      errors: [{ woId: "wo-1", error: "plain failure" }],
    });
  });
});

// ── updateBayCount ────────────────────────────────────────────────

describe("updateBayCount", () => {
  it("rejects counts outside 1-50", async () => {
    await expect(updateBayCount(db as never, ORG_ID, 0)).rejects.toThrow(
      ValidationError,
    );
    await expect(updateBayCount(db as never, ORG_ID, 51)).rejects.toThrow(
      "Bay count must be between 1 and 50",
    );
  });

  it("throws NotFoundError when no main branch exists", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const p = updateBayCount(db as never, ORG_ID, 4);
    await expect(p).rejects.toThrow(NotFoundError);
    await expect(p).rejects.toThrow("Main branch not found");
  });

  it("updates settings when increasing bay count (no occupancy check)", async () => {
    db.__qb.resolveOnce({
      data: { id: "branch-1", settings: { bay_count: 4 } },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(updateBayCount(db as never, ORG_ID, 6)).resolves.toBe(6);

    expect(db.from("branches").update).toHaveBeenCalledWith(
      expect.objectContaining({ settings: { bay_count: 6 } }),
    );
    expect(db.from("work_orders").gt).not.toHaveBeenCalled();
  });

  it("allows reducing count when no bays above target are occupied", async () => {
    db.__qb.resolveOnce({
      data: { id: "branch-1", settings: { bay_count: 6 } },
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(updateBayCount(db as never, ORG_ID, 3)).resolves.toBe(3);

    expect(db.from("work_orders").gt).toHaveBeenCalledWith("bay_number", 3);
    expect(db.from("branches").update).toHaveBeenCalledWith(
      expect.objectContaining({ settings: { bay_count: 3 } }),
    );
  });

  it("throws ValidationError listing occupied bays above target", async () => {
    db.__qb.resolveOnce({
      data: { id: "branch-1", settings: { bay_count: 6 } },
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ bay_number: 5 }, { bay_number: null }, { bay_number: 4 }],
      error: null,
    });

    await expect(updateBayCount(db as never, ORG_ID, 3)).rejects.toThrow(
      "Cannot reduce to 3 bays — bays 4, 5 have active vehicles. Move or complete them first.",
    );
    expect(db.from("branches").update).not.toHaveBeenCalled();
  });

  it("throws and captures on update error", async () => {
    db.__qb.resolveOnce({
      data: { id: "branch-1", settings: { bay_count: 6 } },
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("update failed") });

    await expect(updateBayCount(db as never, ORG_ID, 3)).rejects.toThrow(
      "update failed",
    );
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] updateBayCount",
    });
  });

  it("captures branch-query errors before falling back to NotFound", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("branch fetch") });

    const p = updateBayCount(db as never, ORG_ID, 4);
    await expect(p).rejects.toThrow(NotFoundError);
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] updateBayCount",
    });
  });

  it("captures occupancy-query errors and proceeds with the update", async () => {
    db.__qb.resolveOnce({
      data: { id: "branch-1", settings: { bay_count: 6 } },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: new Error("occupied fetch") });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(updateBayCount(db as never, ORG_ID, 3)).resolves.toBe(3);

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] updateBayCount",
    });
    expect(db.from("branches").update).toHaveBeenCalledWith(
      expect.objectContaining({ settings: { bay_count: 3 } }),
    );
  });

  it("falls back to generic message when update error has no message", async () => {
    db.__qb.resolveOnce({
      data: { id: "branch-1", settings: { bay_count: 6 } },
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(updateBayCount(db as never, ORG_ID, 3)).rejects.toThrow(
      "Failed to update bay count",
    );
  });

  it("defaults settings to empty object and bay count to 6 when branch settings are null", async () => {
    db.__qb.resolveOnce({
      data: { id: "branch-1", settings: null },
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(updateBayCount(db as never, ORG_ID, 3)).resolves.toBe(3);

    expect(db.from("branches").update).toHaveBeenCalledWith(
      expect.objectContaining({ settings: { bay_count: 3 } }),
    );
  });
});

// ── seedWaitingQueue ──────────────────────────────────────────────

describe("seedWaitingQueue", () => {
  const SEED_NOTES = [
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

  it("throws when no main branch exists", async () => {
    await expect(
      seedWaitingQueue(db as never, ORG_ID, "user-1"),
    ).rejects.toThrow("Branch not found");
  });

  it("creates customers, vehicles and work orders for all seed vehicles", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    for (let i = 0; i < 12; i++) {
      db.__qb.resolveOnce({ data: null, error: null }); // no existing customer
      db.__qb.resolveOnce({ data: { id: `cust-${i}` }, error: null }); // insert customer
      db.__qb.resolveOnce({ data: null, error: null }); // no existing vehicle
      db.__qb.resolveOnce({ data: { id: `veh-${i}` }, error: null }); // insert vehicle
    }

    const result = await seedWaitingQueue(db as never, ORG_ID, "user-1");

    expect(result).toEqual({ created: 12, errors: [] });
    // `.insert` is a single mock shared by every table on the query builder
    expect(db.from("customers").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        branch_id: "branch-1",
        phone: "99110001",
        created_by: "user-1",
      }),
    );
    expect(db.from("vehicles").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        plate_number: "01-01-УБО",
        make: "Toyota",
        model: "Prius",
        customer_id: "cust-0",
      }),
    );
    expect(mockCreateWorkOrder).toHaveBeenCalledTimes(12);
    expect(mockCreateWorkOrder).toHaveBeenNthCalledWith(1, db, ORG_ID, {
      customer_id: "cust-0",
      vehicle_id: "veh-0",
      branchId: "branch-1",
      notes: SEED_NOTES[0],
    });
    expect(mockCreateWorkOrder).toHaveBeenNthCalledWith(12, db, ORG_ID, {
      customer_id: "cust-11",
      vehicle_id: "veh-11",
      branchId: "branch-1",
      notes: SEED_NOTES[11],
    });
    expect(db.from("customers").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        branch_id: "branch-1",
        phone: "99110001",
        created_by: "user-1",
      }),
    );
  });

  it("reuses existing customers and vehicles (dedupe, no inserts)", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    for (let i = 0; i < 12; i++) {
      db.__qb.resolveOnce({ data: { id: `cust-${i}` }, error: null });
      db.__qb.resolveOnce({ data: { id: `veh-${i}` }, error: null });
    }

    const result = await seedWaitingQueue(db as never, ORG_ID, "user-1");

    expect(result).toEqual({ created: 12, errors: [] });
    expect(db.from("customers").insert).not.toHaveBeenCalled();
    expect(db.from("vehicles").insert).not.toHaveBeenCalled();
    expect(mockCreateWorkOrder).toHaveBeenCalledTimes(12);
  });

  it("collects per-vehicle errors and continues seeding", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    for (let i = 0; i < 12; i++) {
      db.__qb.resolveOnce({ data: null, error: null }); // no existing customer
      db.__qb.resolveOnce({ data: null, error: null }); // insert returns no data
      db.__qb.resolveOnce({ data: null, error: null }); // no existing vehicle
      db.__qb.resolveOnce({ data: null, error: null }); // insert returns no data
    }

    const result = await seedWaitingQueue(db as never, ORG_ID, "user-1");

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(12);
    expect(result.errors[0]).toBe(
      "01-01-УБО: customer insert returned no data",
    );
    expect(mockReportServerError).toHaveBeenCalledTimes(12);
  });

  it("reports createWorkOrder failures per vehicle", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    for (let i = 0; i < 12; i++) {
      db.__qb.resolveOnce({ data: null, error: null });
      db.__qb.resolveOnce({ data: { id: `cust-${i}` }, error: null });
      db.__qb.resolveOnce({ data: null, error: null });
      db.__qb.resolveOnce({ data: { id: `veh-${i}` }, error: null });
    }
    mockCreateWorkOrder.mockRejectedValueOnce(new Error("RLS denied"));

    const result = await seedWaitingQueue(db as never, ORG_ID, "user-1");

    expect(result.created).toBe(11);
    expect(result.errors).toEqual(["01-01-УБО: RLS denied"]);
    expect(mockReportServerError).toHaveBeenCalledTimes(1);
  });

  it("reports vehicle insert returning no data", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    for (let i = 0; i < 12; i++) {
      db.__qb.resolveOnce({ data: null, error: null });
      db.__qb.resolveOnce({ data: { id: `cust-${i}` }, error: null });
      db.__qb.resolveOnce({ data: null, error: null });
      db.__qb.resolveOnce({ data: null, error: null }); // vehicle insert: no data
    }

    const result = await seedWaitingQueue(db as never, ORG_ID, "user-1");

    expect(result.created).toBe(0);
    expect(result.errors[0]).toBe("01-01-УБО: vehicle insert returned no data");
    expect(result.errors).toHaveLength(12);
    expect(mockReportServerError).toHaveBeenCalledTimes(12);
  });

  it("captures customer/vehicle lookup errors and still seeds", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    for (let i = 0; i < 12; i++) {
      db.__qb.resolveOnce({ data: null, error: new Error("cust lookup") });
      db.__qb.resolveOnce({ data: { id: `cust-${i}` }, error: null });
      db.__qb.resolveOnce({ data: null, error: new Error("veh lookup") });
      db.__qb.resolveOnce({ data: { id: `veh-${i}` }, error: null });
    }

    const result = await seedWaitingQueue(db as never, ORG_ID, "user-1");

    expect(result).toEqual({ created: 12, errors: [] });
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] seedWaitingQueue",
    });
    expect(mockCapture).toHaveBeenCalledTimes(24);
  });

  it("captures insert errors that still return data", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    for (let i = 0; i < 12; i++) {
      db.__qb.resolveOnce({ data: null, error: null });
      db.__qb.resolveOnce({
        data: { id: `cust-${i}` },
        error: new Error("cust insert"),
      });
      db.__qb.resolveOnce({ data: null, error: null });
      db.__qb.resolveOnce({
        data: { id: `veh-${i}` },
        error: new Error("veh insert"),
      });
    }

    const result = await seedWaitingQueue(db as never, ORG_ID, "user-1");

    expect(result).toEqual({ created: 12, errors: [] });
    expect(mockCapture).toHaveBeenCalledTimes(24);
  });

  it("captures the branch lookup error before throwing", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: null, error: new Error("branch fetch") });

    await expect(
      seedWaitingQueue(db as never, ORG_ID, "user-1"),
    ).rejects.toThrow("Branch not found");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] seedWaitingQueue",
    });
  });

  it("stringifies non-Error createWorkOrder failures", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    for (let i = 0; i < 12; i++) {
      db.__qb.resolveOnce({ data: null, error: null });
      db.__qb.resolveOnce({ data: { id: `cust-${i}` }, error: null });
      db.__qb.resolveOnce({ data: null, error: null });
      db.__qb.resolveOnce({ data: { id: `veh-${i}` }, error: null });
    }
    mockCreateWorkOrder.mockRejectedValueOnce("plain failure");

    const result = await seedWaitingQueue(db as never, ORG_ID, "user-1");

    expect(result.created).toBe(11);
    expect(result.errors).toEqual(["01-01-УБО: plain failure"]);
  });
});

// ── assignToFirstAvailableBay ─────────────────────────────────────

describe("assignToFirstAvailableBay", () => {
  it("picks the lowest free bay and clears stale data", async () => {
    // default maybeSingle → no branch settings → bayCount 6
    db.__qb.resolveOnce({
      data: [{ bay_number: 1 }, { bay_number: 3 }],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignToFirstAvailableBay(db as never, ORG_ID, WO_ID),
    ).resolves.toBe(2);

    expect(db.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({ bay_number: 2, status: "New" }),
    );
    expect(db.from("work_order_services").delete).toHaveBeenCalled();
    expect(db.from("work_order_parts").delete).toHaveBeenCalled();
    expect(db.from("work_order_helpers").delete).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("uses the last bay when all but the last are occupied", async () => {
    db.__qb.resolveOnce({
      data: [
        { bay_number: 1 },
        { bay_number: 2 },
        { bay_number: 3 },
        { bay_number: 4 },
        { bay_number: 5 },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignToFirstAvailableBay(db as never, ORG_ID, WO_ID),
    ).resolves.toBe(6);
  });

  it("honors bay count from branch settings", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({
      data: { settings: { bay_count: 3 } },
      error: null,
    });
    db.__qb.resolveOnce({ data: [{ bay_number: 1 }], error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignToFirstAvailableBay(db as never, ORG_ID, WO_ID),
    ).resolves.toBe(2);
  });

  it("throws and captures on update error", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("assign failed") });

    await expect(
      assignToFirstAvailableBay(db as never, ORG_ID, WO_ID),
    ).rejects.toThrow("assign failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] assignToFirstAvailableBay",
    });
  });

  it("captures branch-query errors and falls back to 6 bays", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: null, error: new Error("branch fetch") });
    db.__qb.resolveOnce({ data: [{ bay_number: 1 }], error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignToFirstAvailableBay(db as never, ORG_ID, WO_ID),
    ).resolves.toBe(2);

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] assignToFirstAvailableBay",
    });
  });

  it("captures occupancy-query errors and assigns bay 1", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("active fetch") });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      assignToFirstAvailableBay(db as never, ORG_ID, WO_ID),
    ).resolves.toBe(1);

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] assignToFirstAvailableBay",
    });
    expect(db.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({ bay_number: 1 }),
    );
  });

  it("captures stale-data delete errors and still returns the bay", async () => {
    db.__qb.resolveOnce({ data: [{ bay_number: 1 }], error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("services del") });
    db.__qb.resolveOnce({ data: null, error: new Error("parts del") });
    db.__qb.resolveOnce({ data: null, error: new Error("helpers del") });

    await expect(
      assignToFirstAvailableBay(db as never, ORG_ID, WO_ID),
    ).resolves.toBe(2);

    expect(mockCapture).toHaveBeenCalledTimes(3);
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("falls back to generic message when update error has no message", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      assignToFirstAvailableBay(db as never, ORG_ID, WO_ID),
    ).rejects.toThrow("Failed to assign vehicle to bay");
  });
});

// ── reorderQueue ──────────────────────────────────────────────────

describe("reorderQueue", () => {
  it("updates queue_order for each entry", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      reorderQueue(db as never, ORG_ID, [
        { id: "wo-1", queue_order: 2 },
        { id: "wo-2", queue_order: 1 },
      ]),
    ).resolves.toBeUndefined();

    expect(db.from("work_orders").update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ queue_order: 2 }),
    );
    expect(db.from("work_orders").update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ queue_order: 1 }),
    );
  });

  it("throws and captures on update error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("reorder failed") });

    await expect(
      reorderQueue(db as never, ORG_ID, [{ id: "wo-1", queue_order: 1 }]),
    ).rejects.toThrow("reorder failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] reorderQueue",
    });
  });

  it("falls back to generic message when error has no message", async () => {
    db.__qb.resolveOnce({ data: null, error: { code: "23514" } });

    await expect(
      reorderQueue(db as never, ORG_ID, [{ id: "wo-1", queue_order: 1 }]),
    ).rejects.toThrow("Failed to reorder queue");
  });
});

// ── getShiftReport ────────────────────────────────────────────────

describe("getShiftReport", () => {
  it("returns zeroed report when no data", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, count: 0, error: null });

    const result = await getShiftReport(db as never, ORG_ID);

    expect(result).toEqual({
      completedToday: 0,
      revenueToday: 0,
      avgDurationMinutes: 0,
      bayUtilization: 0,
      bayCount: 6,
      activeJobs: 0,
      revenuePerLaborHour: 0,
    });
    expect(db.from("branches").eq).toHaveBeenCalledWith("is_main", true);
  });

  it("aggregates revenue, duration, labor hours and utilization", async () => {
    db.__qb.resolveOnce({
      data: [
        {
          total: 100,
          started_at: "2026-08-06T09:00:00Z",
          completed_at: "2026-08-06T10:00:00Z",
        },
        { total: 50, started_at: null, completed_at: "2026-08-06T11:00:00Z" },
        {
          total: 150,
          started_at: "2026-08-06T10:00:00Z",
          completed_at: "2026-08-06T09:00:00Z",
        },
        {
          total: 200,
          started_at: "2026-08-06T08:00:00Z",
          completed_at: "2026-08-06T09:30:00Z",
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "a1", started_at: null }],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, count: 3, error: null });

    const result = await getShiftReport(db as never, ORG_ID);

    // 60 + 90 = 150 valid minutes across 4 completed → avg 38 (rounded)
    expect(result).toEqual({
      completedToday: 4,
      revenueToday: 500,
      avgDurationMinutes: 38,
      bayUtilization: 50,
      bayCount: 6,
      activeJobs: 1,
      revenuePerLaborHour: 200,
    });
  });

  it("queries by branch id and uses branch bay count when provided", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({
      data: { settings: { bay_count: 10 } },
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, count: 1, error: null });

    const result = await getShiftReport(db as never, ORG_ID, "branch-2");

    expect(db.from("branches").eq).toHaveBeenCalledWith("id", "branch-2");
    expect(result.bayCount).toBe(10);
    expect(result.bayUtilization).toBe(10); // 1 / 10
    expect(mockWithBranchFilter).toHaveBeenCalledTimes(3);
    expect(mockWithBranchFilter).toHaveBeenCalledWith(
      expect.anything(),
      "branch-2",
    );
  });

  it("captures query errors and falls back to zeroed report", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("completed failed") });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, count: null, error: null });

    const result = await getShiftReport(db as never, ORG_ID);

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] getShiftReport",
    });
    expect(result.completedToday).toBe(0);
    expect(result.revenueToday).toBe(0);
    expect(result.bayUtilization).toBe(0);
  });

  it("captures branch, active and in-bay errors and falls back to zeroed report", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: null, error: new Error("branch fetch") });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("active fetch") });
    db.__qb.resolveOnce({
      data: null,
      count: null,
      error: new Error("count fetch"),
    });

    const result = await getShiftReport(db as never, ORG_ID);

    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] getShiftReport",
    });
    expect(mockCapture).toHaveBeenCalledTimes(3);
    expect(result.bayCount).toBe(6);
    expect(result.completedToday).toBe(0);
    expect(result.activeJobs).toBe(0);
    expect(result.bayUtilization).toBe(0);
  });

  it("accumulates labor minutes from active started_at timestamps", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [
        { id: "a1", started_at: "2020-01-01T00:00:00Z" },
        { id: "a2", started_at: "2099-01-01T00:00:00Z" }, // future → negative mins, skipped
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, count: 0, error: null });

    const result = await getShiftReport(db as never, ORG_ID);

    expect(result.activeJobs).toBe(2);
    expect(result.revenueToday).toBe(0);
    // Huge labor hours → per-hour revenue rounds down to 0
    expect(result.revenuePerLaborHour).toBe(0);
  });

  it("returns zero utilization when bay count is zero", async () => {
    routeMaybeSingleThroughQueue();
    db.__qb.resolveOnce({ data: { settings: { bay_count: 0 } }, error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, count: 0, error: null });

    const result = await getShiftReport(db as never, ORG_ID);

    expect(result.bayCount).toBe(0);
    expect(result.bayUtilization).toBe(0);
  });
});

// ── updateBayViewPin ──────────────────────────────────────────────

describe("updateBayViewPin", () => {
  it("rejects non-digit or out-of-range new pin", async () => {
    await expect(
      updateBayViewPin(db as never, ORG_ID, "1234", "abc", "abc"),
    ).rejects.toThrow(ValidationError);
    await expect(
      updateBayViewPin(db as never, ORG_ID, "1234", "123", "123"),
    ).rejects.toThrow("PIN must be 4 to 6 digits");
  });

  it("rejects when new pin does not match confirmation", async () => {
    await expect(
      updateBayViewPin(db as never, ORG_ID, "1234", "5678", "9999"),
    ).rejects.toThrow(ValidationError);
    await expect(
      updateBayViewPin(db as never, ORG_ID, "1234", "5678", "9999"),
    ).rejects.toThrow("PIN confirmation does not match");
  });

  it("rejects when current pin verification fails", async () => {
    db.rpc.mockResolvedValueOnce({ data: false, error: null });

    await expect(
      updateBayViewPin(db as never, ORG_ID, "wrong", "5678", "5678"),
    ).rejects.toThrow("Current PIN is incorrect");
    expect(db.rpc).toHaveBeenCalledWith("verify_organization_bay_view_pin", {
      target_org_id: ORG_ID,
      plain_pin: "wrong",
    });
    expect(db.rpc).not.toHaveBeenCalledWith(
      "set_organization_bay_view_pin",
      expect.anything(),
    );
  });

  it("verifies current pin and sets the new pin on success", async () => {
    db.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await expect(
      updateBayViewPin(db as never, ORG_ID, "1234", "567890", "567890"),
    ).resolves.toBeUndefined();

    expect(db.rpc).toHaveBeenNthCalledWith(
      1,
      "verify_organization_bay_view_pin",
      { target_org_id: ORG_ID, plain_pin: "1234" },
    );
    expect(db.rpc).toHaveBeenNthCalledWith(2, "set_organization_bay_view_pin", {
      target_org_id: ORG_ID,
      plain_pin: "567890",
    });
  });

  it("throws ValidationError when setting the pin fails", async () => {
    db.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: new Error("set pin failed"),
      });

    const p = updateBayViewPin(db as never, ORG_ID, "1234", "5678", "5678");
    await expect(p).rejects.toThrow(ValidationError);
    await expect(p).rejects.toThrow("set pin failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] updateBayViewPin",
    });
  });

  it("captures verify errors and rejects as incorrect current pin", async () => {
    db.rpc.mockResolvedValueOnce({
      data: null,
      error: new Error("verify failed"),
    });

    await expect(
      updateBayViewPin(db as never, ORG_ID, "1234", "5678", "5678"),
    ).rejects.toThrow("Current PIN is incorrect");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "[bay-view-service] updateBayViewPin",
    });
  });
});
