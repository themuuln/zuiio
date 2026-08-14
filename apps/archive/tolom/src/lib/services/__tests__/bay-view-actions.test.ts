import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

// ── Module-level mocks ────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  UnauthorizedError: class extends Error {
    constructor(msg = "Unauthorized") {
      super(msg);
      this.name = "UnauthorizedError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));
// bay-view-service.actions.ts delegates to ../bay-view-service — mock it so
// tests exercise the action plumbing (auth + arg passing), not the service logic.
vi.mock("../bay-view-service", () => ({
  getBayViewData: vi.fn(),
  getBayViewDataFresh: vi.fn(),
  getShiftReport: vi.fn(),
  assignVehicleToBay: vi.fn(),
  swapBayNumbers: vi.fn(),
  removeVehicleFromBay: vi.fn(),
  assignMechanicToWorkOrder: vi.fn(),
  unassignMechanicFromWorkOrder: vi.fn(),
  assignHelperToWorkOrder: vi.fn(),
  removeHelperFromWorkOrder: vi.fn(),
  updateWorkOrderStatus: vi.fn(),
  batchCompleteWorkOrders: vi.fn(),
  updateBayCount: vi.fn(),
  reorderQueue: vi.fn(),
  reorderWorkOrderHelpers: vi.fn(),
  updateBayViewPin: vi.fn(),
}));

import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  assignHelperToWorkOrder as serviceAssignHelperToWorkOrder,
  assignMechanicToWorkOrder as serviceAssignMechanicToWorkOrder,
  assignVehicleToBay as serviceAssignVehicleToBay,
  batchCompleteWorkOrders as serviceBatchCompleteWorkOrders,
  getBayViewData as serviceGetBayViewData,
  getBayViewDataFresh as serviceGetBayViewDataFresh,
  getShiftReport as serviceGetShiftReport,
  removeHelperFromWorkOrder as serviceRemoveHelperFromWorkOrder,
  removeVehicleFromBay as serviceRemoveVehicleFromBay,
  reorderQueue as serviceReorderQueue,
  reorderWorkOrderHelpers as serviceReorderWorkOrderHelpers,
  swapBayNumbers as serviceSwapBayNumbers,
  unassignMechanicFromWorkOrder as serviceUnassignMechanicFromWorkOrder,
  updateBayCount as serviceUpdateBayCount,
  updateBayViewPin as serviceUpdateBayViewPin,
  updateWorkOrderStatus as serviceUpdateWorkOrderStatus,
} from "../bay-view-service";
import * as actions from "../bay-view-service.actions";

const mockCreateClient = vi.mocked(createClient);

const ORG_ID = "org-1";
const USER_ID = "test-user-id";
const WO_ID = "wo-1";

const SHIFT_REPORT = {
  completedToday: 3,
  revenueToday: 450_000,
  avgDurationMinutes: 55,
  bayUtilization: 0.8,
  bayCount: 4,
  activeJobs: 2,
  revenuePerLaborHour: 18_000,
};

const BAY_VIEW_DATA = {
  bayCount: 4,
  bays: [],
  branches: [{ id: "branch-1", name: "UB Main" }],
  waitingQueue: [],
  mechanics: [],
  shiftReport: SHIFT_REPORT,
};

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockCreateClient.mockResolvedValue(db as never);
  db.rpc.mockResolvedValue({ data: ORG_ID, error: null });
});

// ── Auth gating ───────────────────────────────────────────────────

describe("auth gating", () => {
  it("rejects with UnauthorizedError when there is no authenticated user", async () => {
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(actions.getBayViewData()).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(serviceGetBayViewData).not.toHaveBeenCalled();
  });

  it("rejects with UnauthorizedError when no organization is resolved", async () => {
    db.rpc.mockResolvedValue({ data: null, error: null });

    await expect(actions.getBayViewData()).rejects.toThrowError(
      "Choose an organization to continue",
    );
    expect(serviceGetBayViewData).not.toHaveBeenCalled();
  });

  it("rejects with UnauthorizedError when the organization RPC returns an error", async () => {
    db.rpc.mockResolvedValue({ data: null, error: { message: "rpc down" } });

    await expect(actions.getBayViewData()).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(serviceGetBayViewData).not.toHaveBeenCalled();
  });

  it("also gates withOrgAndUser actions on authentication", async () => {
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      actions.assignHelperToWorkOrder(WO_ID, "mech-2"),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(serviceAssignHelperToWorkOrder).not.toHaveBeenCalled();
  });
});

// ── Read functions ────────────────────────────────────────────────

describe("getBayViewData", () => {
  it("resolves with bay view data and passes branchId through", async () => {
    serviceGetBayViewData.mockResolvedValue(BAY_VIEW_DATA);

    const result = await actions.getBayViewData("branch-1");

    expect(result).toEqual(BAY_VIEW_DATA);
    expect(serviceGetBayViewData).toHaveBeenCalledWith(db, ORG_ID, "branch-1");
    expect(db.rpc).toHaveBeenCalledWith("get_user_organization_id");
  });

  it("passes undefined branchId when omitted", async () => {
    serviceGetBayViewData.mockResolvedValue(BAY_VIEW_DATA);

    await actions.getBayViewData();

    expect(serviceGetBayViewData).toHaveBeenCalledWith(db, ORG_ID, undefined);
  });
});

describe("getBayViewDataFresh", () => {
  it("resolves with fresh bay view data and passes branchId through", async () => {
    serviceGetBayViewDataFresh.mockResolvedValue(BAY_VIEW_DATA);

    const result = await actions.getBayViewDataFresh("branch-1");

    expect(result).toEqual(BAY_VIEW_DATA);
    expect(serviceGetBayViewDataFresh).toHaveBeenCalledWith(
      db,
      ORG_ID,
      "branch-1",
    );
  });
});

describe("getShiftReport", () => {
  it("resolves with the shift report and passes branchId through", async () => {
    serviceGetShiftReport.mockResolvedValue(SHIFT_REPORT);

    const result = await actions.getShiftReport("branch-2");

    expect(result).toEqual(SHIFT_REPORT);
    expect(serviceGetShiftReport).toHaveBeenCalledWith(db, ORG_ID, "branch-2");
  });
});

// ── Mutations ─────────────────────────────────────────────────────

describe("assignVehicleToBay", () => {
  it("delegates to the service with orgId, workOrderId and bayNumber", async () => {
    serviceAssignVehicleToBay.mockResolvedValue(undefined);

    await actions.assignVehicleToBay(WO_ID, 3);

    expect(serviceAssignVehicleToBay).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
      3,
    );
  });

  it("propagates service validation failures", async () => {
    serviceAssignVehicleToBay.mockRejectedValue(
      new ValidationError("Bay number 9 is out of range"),
    );

    await expect(actions.assignVehicleToBay(WO_ID, 9)).rejects.toThrowError(
      "Bay number 9 is out of range",
    );
  });
});

describe("swapBayNumbers", () => {
  it("delegates with both work orders and bay numbers", async () => {
    serviceSwapBayNumbers.mockResolvedValue(undefined);

    await actions.swapBayNumbers("wo-a", 1, "wo-b", 2);

    expect(serviceSwapBayNumbers).toHaveBeenCalledWith(
      db,
      ORG_ID,
      "wo-a",
      1,
      "wo-b",
      2,
    );
  });
});

describe("removeVehicleFromBay", () => {
  it("delegates with the workOrderId", async () => {
    serviceRemoveVehicleFromBay.mockResolvedValue(undefined);

    await actions.removeVehicleFromBay(WO_ID);

    expect(serviceRemoveVehicleFromBay).toHaveBeenCalledWith(db, ORG_ID, WO_ID);
  });
});

describe("assignMechanicToWorkOrder", () => {
  it("delegates with workOrderId and mechanicId", async () => {
    serviceAssignMechanicToWorkOrder.mockResolvedValue(undefined);

    await actions.assignMechanicToWorkOrder(WO_ID, "mech-1");

    expect(serviceAssignMechanicToWorkOrder).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
      "mech-1",
    );
  });
});

describe("unassignMechanicFromWorkOrder", () => {
  it("delegates with the workOrderId", async () => {
    serviceUnassignMechanicFromWorkOrder.mockResolvedValue(undefined);

    await actions.unassignMechanicFromWorkOrder(WO_ID);

    expect(serviceUnassignMechanicFromWorkOrder).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
    );
  });
});

describe("assignHelperToWorkOrder", () => {
  it("delegates with workOrderId, mechanicId and the current userId", async () => {
    serviceAssignHelperToWorkOrder.mockResolvedValue(undefined);

    await actions.assignHelperToWorkOrder(WO_ID, "mech-2");

    expect(serviceAssignHelperToWorkOrder).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
      "mech-2",
      USER_ID,
    );
  });

  it("passes the authenticated user's id when it differs from the default", async () => {
    serviceAssignHelperToWorkOrder.mockResolvedValue(undefined);
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-42" } },
      error: null,
    });

    await actions.assignHelperToWorkOrder(WO_ID, "mech-2");

    expect(serviceAssignHelperToWorkOrder).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
      "mech-2",
      "user-42",
    );
  });
});

describe("removeHelperFromWorkOrder", () => {
  it("delegates with workOrderId and mechanicId", async () => {
    serviceRemoveHelperFromWorkOrder.mockResolvedValue(undefined);

    await actions.removeHelperFromWorkOrder(WO_ID, "mech-2");

    expect(serviceRemoveHelperFromWorkOrder).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
      "mech-2",
    );
  });
});

describe("updateWorkOrderStatus", () => {
  it("delegates with status and notes", async () => {
    serviceUpdateWorkOrderStatus.mockResolvedValue(undefined);

    await actions.updateWorkOrderStatus(WO_ID, "Completed", "done");

    expect(serviceUpdateWorkOrderStatus).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
      "Completed",
      "done",
    );
  });

  it("passes undefined notes when omitted", async () => {
    serviceUpdateWorkOrderStatus.mockResolvedValue(undefined);

    await actions.updateWorkOrderStatus(WO_ID, "New");

    expect(serviceUpdateWorkOrderStatus).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
      "New",
      undefined,
    );
  });
});

describe("updateWorkOrderNotes", () => {
  it("updates notes and updated_at scoped to the work order and org", async () => {
    await actions.updateWorkOrderNotes(WO_ID, "lubricate hinges");

    expect(db.from).toHaveBeenCalledWith("work_orders");
    const workOrdersQuery = vi.mocked(db.from("work_orders"));
    expect(workOrdersQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: "lubricate hinges",
        updated_at: expect.any(String),
      }),
    );
    expect(workOrdersQuery.eq).toHaveBeenNthCalledWith(1, "id", WO_ID);
    expect(workOrdersQuery.eq).toHaveBeenNthCalledWith(
      2,
      "organization_id",
      ORG_ID,
    );
  });

  it("throws the db error message when the update fails", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "db failure" } });

    await expect(
      actions.updateWorkOrderNotes(WO_ID, "lubricate hinges"),
    ).rejects.toThrowError("db failure");
  });
});

describe("batchCompleteWorkOrders", () => {
  it("resolves with the batch result and passes work order ids through", async () => {
    const batchResult = {
      succeeded: 2,
      failed: 1,
      errors: [{ woId: "wo-3", error: "not ready" }],
    };
    serviceBatchCompleteWorkOrders.mockResolvedValue(batchResult);

    const result = await actions.batchCompleteWorkOrders([
      "wo-1",
      "wo-2",
      "wo-3",
    ]);

    expect(result).toEqual(batchResult);
    expect(serviceBatchCompleteWorkOrders).toHaveBeenCalledWith(db, ORG_ID, [
      "wo-1",
      "wo-2",
      "wo-3",
    ]);
  });

  it("propagates service failures", async () => {
    serviceBatchCompleteWorkOrders.mockRejectedValue(new Error("batch failed"));

    await expect(
      actions.batchCompleteWorkOrders(["wo-1"]),
    ).rejects.toThrowError("batch failed");
  });
});

describe("updateBayCount", () => {
  it("resolves with the new bay count and passes it through", async () => {
    serviceUpdateBayCount.mockResolvedValue(14);

    const result = await actions.updateBayCount(14);

    expect(result).toBe(14);
    expect(serviceUpdateBayCount).toHaveBeenCalledWith(db, ORG_ID, 14);
  });
});

describe("reorderQueue", () => {
  it("delegates with the queue updates", async () => {
    serviceReorderQueue.mockResolvedValue(undefined);
    const updates = [
      { id: "wo-1", queue_order: 1 },
      { id: "wo-2", queue_order: 2 },
    ];

    await actions.reorderQueue(updates);

    expect(serviceReorderQueue).toHaveBeenCalledWith(db, ORG_ID, updates);
  });
});

describe("reorderWorkOrderHelpers", () => {
  it("delegates with workOrderId and ordered mechanic ids", async () => {
    serviceReorderWorkOrderHelpers.mockResolvedValue(undefined);

    await actions.reorderWorkOrderHelpers(WO_ID, ["h1", "h2"]);

    expect(serviceReorderWorkOrderHelpers).toHaveBeenCalledWith(
      db,
      ORG_ID,
      WO_ID,
      ["h1", "h2"],
    );
  });
});

describe("updateBayViewPin", () => {
  it("delegates with current, new and confirm pins", async () => {
    serviceUpdateBayViewPin.mockResolvedValue(undefined);

    await actions.updateBayViewPin("0000", "1234", "1234");

    expect(serviceUpdateBayViewPin).toHaveBeenCalledWith(
      db,
      ORG_ID,
      "0000",
      "1234",
      "1234",
    );
  });
});
