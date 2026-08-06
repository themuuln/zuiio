import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { drawerDetailKeys } from "@/lib/queries/use-drawer-queries";
import type { BaySlotData, BayViewData } from "@/lib/services/bay-view-service";
import { DEFAULT_PAYMENT_METHOD_FEES } from "../_payment-fees";
import type { PostServiceFormData } from "../_schema";
import type { BayViewDialogsState } from "../_use-bay-view-dialogs";
import {
  type BayViewMutationsParams,
  useBayViewMutations,
} from "../_use-bay-view-mutations";
import type { BayViewPendingState } from "../_use-bay-view-pending";
import type { PickupCompleteData } from "../pickup-complete-dialog";

// ── Hoisted mocks (referenced by vi.mock factories) ──────────────

const bayMutations = vi.hoisted(() => {
  const create = () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
  });
  return {
    updateStatus: create(),
    assign: create(),
    remove: create(),
    updateBayCount: create(),
    assignMechanic: create(),
    removeMechanic: create(),
    addHelper: create(),
    removeHelper: create(),
    assignCustomer: create(),
    batchComplete: create(),
    swap: create(),
  };
});

vi.mock("@/lib/queries/use-bay-view", () => ({
  useUpdateBayViewStatus: () => bayMutations.updateStatus,
  useAssignVehicleToBay: () => bayMutations.assign,
  useRemoveVehicleFromBay: () => bayMutations.remove,
  useUpdateBayCount: () => bayMutations.updateBayCount,
  useAssignMechanicToWorkOrder: () => bayMutations.assignMechanic,
  useRemoveMechanicFromWorkOrder: () => bayMutations.removeMechanic,
  useAddHelperToWorkOrder: () => bayMutations.addHelper,
  useRemoveHelperFromWorkOrder: () => bayMutations.removeHelper,
  useAssignCustomerToWorkOrder: () => bayMutations.assignCustomer,
  useBatchCompleteMutation: () => bayMutations.batchComplete,
  useSwapBays: () => bayMutations.swap,
}));

const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  }),
);
vi.mock("sonner", () => ({ toast: toastMock }));

const reportServerErrorMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

const bayActionsMock = vi.hoisted(() => ({
  reorderQueue: vi.fn().mockResolvedValue(undefined),
  reorderWorkOrderHelpers: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/bay-view-service.actions", () => bayActionsMock);

const postServiceMock = vi.hoisted(() => ({
  savePostServiceData: vi.fn().mockResolvedValue(undefined),
  saveCompletionData: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/post-service-service", () => postServiceMock);

const paymentHelpersMock = vi.hoisted(() => ({
  createInvoiceAndRecordPayment: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../_payment-helpers", () => paymentHelpersMock);

// ── Fixtures ─────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function makeDialogs(
  overrides: Partial<BayViewDialogsState> = {},
): BayViewDialogsState {
  return {
    open: {
      shiftReport: false,
      vehicleReg: false,
      batchComplete: false,
      assign: false,
    },
    show: vi.fn(),
    hide: vi.fn(),
    set: vi.fn(),
    assignBay: null,
    openAssign: vi.fn(),
    closeAssign: vi.fn(),
    detailWoId: null,
    setDetailWoId: vi.fn(),
    drawerInitialAction: null,
    setDrawerInitialAction: vi.fn(),
    openDetail: vi.fn(),
    closeDetail: vi.fn(),
    directAssignBayNumber: null,
    setDirectAssignBayNumber: vi.fn(),
    anyOpen: false,
    ...overrides,
  };
}

function makePendingState(
  overrides: Partial<BayViewPendingState> = {},
): BayViewPendingState {
  return {
    pending: null,
    clearPending: vi.fn(),
    requestStatusChange: vi.fn(),
    requestPostService: vi.fn(),
    requestPickupComplete: vi.fn(),
    ...overrides,
  };
}

type BayWorkOrder = NonNullable<BaySlotData["workOrder"]>;

function makeBayWorkOrder(overrides: Partial<BayWorkOrder> = {}): BayWorkOrder {
  return {
    id: "wo-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    mechanic_id: null,
    status: "New",
    bay_number: 1,
    queue_order: 0,
    total: "100000",
    vehicle: { id: "veh-1", plate_number: "1234АБВ", odometer: 12000 },
    mechanic: null,
    helpers: [],
    customer_name: "Alice",
    ...overrides,
  } as unknown as BayWorkOrder;
}

function makeData(overrides: Partial<BayViewData> = {}): BayViewData {
  return {
    bayCount: 1,
    bays: [
      {
        bayNumber: 1,
        workOrder: makeBayWorkOrder(),
      },
    ],
    branches: [],
    waitingQueue: [],
    mechanics: [{ id: "mech-1", full_name: "John Doe", current_jobs: 0 }],
    shiftReport: {
      completedToday: 0,
      revenueToday: 0,
      avgDurationMinutes: 0,
      bayUtilization: 0,
      bayCount: 1,
      activeJobs: 1,
      revenuePerLaborHour: 0,
    },
    ...overrides,
  } as unknown as BayViewData;
}

function makeParams(
  overrides: Partial<BayViewMutationsParams> = {},
): BayViewMutationsParams {
  return {
    branchFilter: "branch-1",
    orgId: "org-1",
    data: makeData(),
    pendingWoIds: {},
    markPending: vi.fn(),
    clearPending: vi.fn(),
    setActiveDrag: vi.fn(),
    fetchData: vi.fn().mockResolvedValue(undefined),
    t: (key: string) => key,
    paymentMethodFees: DEFAULT_PAYMENT_METHOD_FEES,
    transferBanks: [],
    dialogs: makeDialogs(),
    pending: makePendingState(),
    ...overrides,
  };
}

const postServiceData: PostServiceFormData = {
  odometerReading: 12000,
  recommendations: [],
  mechanicNotes: "Replaced pads",
  paymentMethod: "cash",
  transferBankId: undefined,
};

const pickupData: PickupCompleteData = {
  customerSatisfaction: 5,
  customerFeedback: "Great",
  nextAppointmentDate: "2026-09-01",
};

function dragStartEvent(
  activeData?: Record<string, unknown>,
  id = "wo-1",
): DragStartEvent {
  return {
    active: { id, data: { current: activeData } },
  } as unknown as DragStartEvent;
}

function dragEndEvent(
  activeData?: Record<string, unknown>,
  overId?: string,
  activeId = "wo-1",
): DragEndEvent {
  return {
    active: { id: activeId, data: { current: activeData } },
    over: overId ? { id: overId } : null,
  } as unknown as DragEndEvent;
}

function renderBayView(params: BayViewMutationsParams) {
  return renderHook((props) => useBayViewMutations(props), {
    initialProps: params,
    wrapper: createWrapper(),
  });
}

// ── Tests ────────────────────────────────────────────────────────

describe("useBayViewMutations", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    for (const m of Object.values(bayMutations)) {
      m.mutateAsync.mockResolvedValue({});
    }
    window.history.replaceState(null, "", "/");
  });

  describe("handleStatusClick", () => {
    it("requests a status change when the work order is not in the bays", () => {
      const pending = makePendingState();
      const { result } = renderBayView(
        makeParams({ data: makeData({ bays: [] }), pending }),
      );

      act(() => result.current.handleStatusClick("missing-wo", "In Progress"));

      expect(pending.requestStatusChange).toHaveBeenCalledWith(
        "missing-wo",
        "In Progress",
      );
    });

    it("intercepts Completed into the pickup-complete flow with total", () => {
      const pending = makePendingState();
      const { result } = renderBayView(makeParams({ pending }));

      act(() => result.current.handleStatusClick("wo-1", "Completed"));

      expect(pending.requestPickupComplete).toHaveBeenCalledWith(
        "wo-1",
        "veh-1",
        expect.any(String),
        "Completed",
        100000,
      );
    });

    it("intercepts Ready for Pickup into the post-service flow with odometer", () => {
      const pending = makePendingState();
      const { result } = renderBayView(makeParams({ pending }));

      act(() => result.current.handleStatusClick("wo-1", "Ready for Pickup"));

      expect(pending.requestPostService).toHaveBeenCalledWith(
        "wo-1",
        "veh-1",
        expect.any(String),
        12000,
        "Ready for Pickup",
        100000,
      );
    });

    it("falls back to a plain status change when Ready for Pickup has no vehicle", () => {
      const pending = makePendingState();
      const data = makeData({
        bays: [
          {
            bayNumber: 1,
            workOrder: makeBayWorkOrder({ vehicle: null }),
          },
        ],
      });
      const { result } = renderBayView(makeParams({ data, pending }));

      act(() => result.current.handleStatusClick("wo-1", "Ready for Pickup"));

      expect(pending.requestPostService).not.toHaveBeenCalled();
      expect(pending.requestStatusChange).toHaveBeenCalledWith(
        "wo-1",
        "Ready for Pickup",
      );
    });

    it("runs Diagnosing/In Progress optimistically and shows an undo toast", async () => {
      const { result } = renderBayView(makeParams());

      await act(async () => {
        result.current.handleStatusClick("wo-1", "Diagnosing");
      });

      expect(bayMutations.updateStatus.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        status: "Diagnosing",
      });
      expect(toastMock.dismiss).toHaveBeenCalled();
      expect(toastMock).toHaveBeenCalledWith(
        "statusUpdatedWithUndo",
        expect.objectContaining({
          action: expect.objectContaining({ label: "undo" }),
          duration: 5000,
        }),
      );

      const opts = toastMock.mock.calls[0]?.[1] as {
        action?: { onClick?: () => void };
      };
      act(() => opts?.action?.onClick?.());

      expect(bayMutations.updateStatus.mutate).toHaveBeenCalledWith({
        woId: "wo-1",
        status: "New",
      });
    });

    it("reports an error when the optimistic status update fails", async () => {
      bayMutations.updateStatus.mutateAsync.mockRejectedValueOnce(
        new Error("boom"),
      );
      const { result } = renderBayView(makeParams());

      await act(async () => {
        result.current.handleStatusClick("wo-1", "In Progress");
      });

      expect(reportServerErrorMock).toHaveBeenCalledWith(
        "Failed to update status",
        expect.any(Error),
      );
      expect(toastMock.error).toHaveBeenCalledWith("Failed to update status");
    });

    it("routes other statuses through requestStatusChange", () => {
      const pending = makePendingState();
      const { result } = renderBayView(makeParams({ pending }));

      act(() => result.current.handleStatusClick("wo-1", "New"));

      expect(pending.requestStatusChange).toHaveBeenCalledWith("wo-1", "New");
    });
  });

  describe("handleStatusModalConfirm", () => {
    it("mutates with notes and clears pending state", async () => {
      const pending = makePendingState();
      const { result } = renderBayView(makeParams({ pending }));

      await act(async () => {
        await result.current.handleStatusModalConfirm(
          "wo-1",
          "Cancelled",
          "note",
        );
      });

      expect(bayMutations.updateStatus.mutate).toHaveBeenCalledWith({
        woId: "wo-1",
        status: "Cancelled",
        notes: "note",
      });
      expect(pending.clearPending).toHaveBeenCalled();
    });

    it("mutates without notes", async () => {
      const pending = makePendingState();
      const { result } = renderBayView(makeParams({ pending }));

      await act(async () => {
        await result.current.handleStatusModalConfirm("wo-1", "Completed");
      });

      expect(bayMutations.updateStatus.mutate).toHaveBeenCalledWith({
        woId: "wo-1",
        status: "Completed",
      });
      expect(pending.clearPending).toHaveBeenCalled();
    });
  });

  describe("handlePostServiceConfirm", () => {
    it("does nothing when pending intercept is not postService", async () => {
      const { result } = renderBayView(makeParams());

      await act(async () => {
        await result.current.handlePostServiceConfirm(postServiceData);
      });

      expect(postServiceMock.savePostServiceData).not.toHaveBeenCalled();
    });

    it("saves post-service data, updates status, and records payment", async () => {
      const pending = makePendingState({
        pending: {
          type: "postService",
          woId: "wo-1",
          vehicleId: "veh-1",
          vehiclePlate: "1234АБВ",
          currentOdometer: 12000,
          newStatus: "Ready for Pickup",
          totalCost: 100000,
        },
      });
      const { result } = renderBayView(makeParams({ pending }));

      await act(async () => {
        await result.current.handlePostServiceConfirm(postServiceData);
      });

      expect(postServiceMock.savePostServiceData).toHaveBeenCalledWith({
        workOrderId: "wo-1",
        vehicleId: "veh-1",
        odometerReading: 12000,
        recommendations: [],
        mechanicNotes: "Replaced pads",
      });
      expect(bayMutations.updateStatus.mutate).toHaveBeenCalledWith({
        woId: "wo-1",
        status: "Ready for Pickup",
      });
      expect(
        paymentHelpersMock.createInvoiceAndRecordPayment,
      ).toHaveBeenCalledWith(
        "org-1",
        "wo-1",
        "cash",
        DEFAULT_PAYMENT_METHOD_FEES.cash,
        [],
        undefined,
      );
      expect(pending.clearPending).toHaveBeenCalled();
    });

    it("skips payment recording when total cost is zero", async () => {
      const pending = makePendingState({
        pending: {
          type: "postService",
          woId: "wo-1",
          vehicleId: "veh-1",
          vehiclePlate: "1234АБВ",
          currentOdometer: null,
          newStatus: "Ready for Pickup",
          totalCost: 0,
        },
      });
      const { result } = renderBayView(makeParams({ pending }));

      await act(async () => {
        await result.current.handlePostServiceConfirm(postServiceData);
      });

      expect(
        paymentHelpersMock.createInvoiceAndRecordPayment,
      ).not.toHaveBeenCalled();
      expect(pending.clearPending).toHaveBeenCalled();
    });

    it("reports payment failure but still clears pending state", async () => {
      const pending = makePendingState({
        pending: {
          type: "postService",
          woId: "wo-1",
          vehicleId: "veh-1",
          vehiclePlate: "1234АБВ",
          currentOdometer: null,
          newStatus: "Ready for Pickup",
          totalCost: 50000,
        },
      });
      paymentHelpersMock.createInvoiceAndRecordPayment.mockRejectedValueOnce(
        new Error("pay failed"),
      );
      const { result } = renderBayView(makeParams({ pending }));

      await act(async () => {
        await result.current.handlePostServiceConfirm(postServiceData);
      });

      expect(reportServerErrorMock).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      );
      expect(toastMock.error).toHaveBeenCalledWith("pay failed");
      expect(pending.clearPending).toHaveBeenCalled();
    });
  });

  describe("handlePickupCompleteConfirm", () => {
    it("does nothing when pending intercept is not pickupComplete", async () => {
      const { result } = renderBayView(makeParams());

      await act(async () => {
        await result.current.handlePickupCompleteConfirm(pickupData);
      });

      expect(postServiceMock.saveCompletionData).not.toHaveBeenCalled();
    });

    it("saves completion data and updates the status", async () => {
      const pending = makePendingState({
        pending: {
          type: "pickupComplete",
          woId: "wo-1",
          vehicleId: "veh-1",
          vehiclePlate: "1234АБВ",
          newStatus: "Completed",
          totalCost: 100000,
        },
      });
      const { result } = renderBayView(makeParams({ pending }));

      await act(async () => {
        await result.current.handlePickupCompleteConfirm(pickupData);
      });

      expect(postServiceMock.saveCompletionData).toHaveBeenCalledWith({
        workOrderId: "wo-1",
        vehicleId: "veh-1",
        customerSatisfaction: 5,
        customerFeedback: "Great",
        nextAppointmentDate: "2026-09-01",
      });
      expect(bayMutations.updateStatus.mutate).toHaveBeenCalledWith({
        woId: "wo-1",
        status: "Completed",
      });
      expect(pending.clearPending).toHaveBeenCalled();
    });

    it("closes the detail drawer and cleans the URL for the completed WO", async () => {
      const closeDetail = vi.fn();
      const dialogs = makeDialogs({ detailWoId: "wo-1", closeDetail });
      const pending = makePendingState({
        pending: {
          type: "pickupComplete",
          woId: "wo-1",
          vehicleId: "veh-1",
          vehiclePlate: "1234АБВ",
          newStatus: "Completed",
          totalCost: 0,
        },
      });
      window.history.pushState(null, "", "?woId=wo-1");
      const { result } = renderBayView(makeParams({ dialogs, pending }));

      await act(async () => {
        await result.current.handlePickupCompleteConfirm(pickupData);
      });

      expect(closeDetail).toHaveBeenCalled();
      expect(window.location.search).not.toContain("woId");
    });

    it("leaves the drawer open when completing a different WO", async () => {
      const closeDetail = vi.fn();
      const dialogs = makeDialogs({ detailWoId: "wo-2", closeDetail });
      const pending = makePendingState({
        pending: {
          type: "pickupComplete",
          woId: "wo-1",
          vehicleId: "veh-1",
          vehiclePlate: "1234АБВ",
          newStatus: "Completed",
          totalCost: 0,
        },
      });
      window.history.pushState(null, "", "?woId=wo-2");
      const { result } = renderBayView(makeParams({ dialogs, pending }));

      await act(async () => {
        await result.current.handlePickupCompleteConfirm(pickupData);
      });

      expect(closeDetail).not.toHaveBeenCalled();
    });
  });

  describe("handleOpenDetail", () => {
    it("seeds the drawer detail cache and pushes the WO id into the URL", () => {
      const openDetail = vi.fn();
      const { result } = renderBayView(
        makeParams({ dialogs: makeDialogs({ openDetail }) }),
      );

      act(() => result.current.handleOpenDetail("wo-1"));

      expect(
        queryClient.getQueryData(drawerDetailKeys.all("org-1", "wo-1")),
      ).toEqual({
        workOrder: expect.objectContaining({ id: "wo-1" }),
      });
      expect(openDetail).toHaveBeenCalledWith("wo-1", undefined);
      expect(window.location.search).toContain("woId=wo-1");
    });

    it("passes the initial action through", () => {
      const openDetail = vi.fn();
      const { result } = renderBayView(
        makeParams({ dialogs: makeDialogs({ openDetail }) }),
      );

      act(() => result.current.handleOpenDetail("wo-1", "add-service"));

      expect(openDetail).toHaveBeenCalledWith("wo-1", "add-service");
    });

    it("skips cache seeding without an orgId", () => {
      const openDetail = vi.fn();
      const { result } = renderBayView(
        makeParams({
          orgId: undefined,
          dialogs: makeDialogs({ openDetail }),
        }),
      );

      act(() => result.current.handleOpenDetail("wo-1"));

      expect(
        queryClient.getQueryData(drawerDetailKeys.all("org-1", "wo-1")),
      ).toBeUndefined();
      expect(openDetail).toHaveBeenCalledWith("wo-1", undefined);
    });
  });

  describe("simple handlers", () => {
    it("handleRemoveFromBay mutates with the work order id", () => {
      const { result } = renderBayView(makeParams());

      act(() => result.current.handleRemoveFromBay("wo-1"));

      expect(bayMutations.remove.mutate).toHaveBeenCalledWith({ woId: "wo-1" });
    });

    it("handleQueueItemClick opens detail and pushes the URL", () => {
      const openDetail = vi.fn();
      const { result } = renderBayView(
        makeParams({ dialogs: makeDialogs({ openDetail }) }),
      );

      act(() => result.current.handleQueueItemClick(makeBayWorkOrder()));

      expect(openDetail).toHaveBeenCalledWith("wo-1");
      expect(window.location.search).toContain("woId=wo-1");
    });

    it("handleEmptyBayClick sets the direct assign bay and opens vehicle registration", () => {
      const setDirectAssignBayNumber = vi.fn();
      const setDialog = vi.fn();
      const { result } = renderBayView(
        makeParams({
          dialogs: makeDialogs({ setDirectAssignBayNumber, set: setDialog }),
        }),
      );

      act(() => result.current.handleEmptyBayClick(3));

      expect(setDirectAssignBayNumber).toHaveBeenCalledWith(3);
      expect(setDialog).toHaveBeenCalledWith("vehicleReg", true);
    });
  });

  describe("handleAssignToBay", () => {
    it("does nothing when no bay is selected", async () => {
      const { result } = renderBayView(makeParams());

      await act(async () => {
        await result.current.handleAssignToBay("wo-9");
      });

      expect(bayMutations.assign.mutate).not.toHaveBeenCalled();
    });

    it("assigns the vehicle and optionally the mechanic", async () => {
      const closeAssign = vi.fn();
      const { result } = renderBayView(
        makeParams({ dialogs: makeDialogs({ assignBay: 2, closeAssign }) }),
      );

      await act(async () => {
        await result.current.handleAssignToBay("wo-9", "mech-1");
      });

      expect(bayMutations.assign.mutate).toHaveBeenCalledWith({
        workOrderId: "wo-9",
        bayNumber: 2,
      });
      expect(bayMutations.assignMechanic.mutate).toHaveBeenCalledWith({
        woId: "wo-9",
        mechanicId: "mech-1",
      });
      expect(closeAssign).toHaveBeenCalled();
    });

    it("does not assign a mechanic when none is provided", async () => {
      const closeAssign = vi.fn();
      const { result } = renderBayView(
        makeParams({ dialogs: makeDialogs({ assignBay: 2, closeAssign }) }),
      );

      await act(async () => {
        await result.current.handleAssignToBay("wo-9");
      });

      expect(bayMutations.assignMechanic.mutate).not.toHaveBeenCalled();
      expect(closeAssign).toHaveBeenCalled();
    });
  });

  describe("handleBatchComplete", () => {
    it("does nothing without data", async () => {
      const { result } = renderBayView(makeParams({ data: null }));

      await act(async () => {
        await result.current.handleBatchComplete();
      });

      expect(bayMutations.batchComplete.mutateAsync).not.toHaveBeenCalled();
    });

    it("does nothing when no work order is ready for pickup", async () => {
      const { result } = renderBayView(makeParams());

      await act(async () => {
        await result.current.handleBatchComplete();
      });

      expect(bayMutations.batchComplete.mutateAsync).not.toHaveBeenCalled();
    });

    it("completes ready work orders and cleans the URL for the open drawer", async () => {
      bayMutations.batchComplete.mutateAsync.mockResolvedValue({
        succeeded: 1,
      });
      const data = makeData({
        bays: [
          {
            bayNumber: 1,
            workOrder: makeBayWorkOrder({ status: "Ready for Pickup" }),
          },
        ],
      });
      const dialogs = makeDialogs({ detailWoId: "wo-1" });
      window.history.pushState(null, "", "?woId=wo-1");
      const { result } = renderBayView(makeParams({ data, dialogs }));

      await act(async () => {
        await result.current.handleBatchComplete();
      });

      expect(bayMutations.batchComplete.mutateAsync).toHaveBeenCalledWith([
        "wo-1",
      ]);
      expect(window.location.search).not.toContain("woId");
    });

    it("keeps the URL when completion succeeds but not for the open drawer", async () => {
      bayMutations.batchComplete.mutateAsync.mockResolvedValue({
        succeeded: 1,
      });
      const data = makeData({
        bays: [
          {
            bayNumber: 1,
            workOrder: makeBayWorkOrder({
              id: "wo-1",
              status: "Ready for Pickup",
            }),
          },
        ],
      });
      const dialogs = makeDialogs({ detailWoId: "wo-2" });
      window.history.pushState(null, "", "?woId=wo-2");
      const { result } = renderBayView(makeParams({ data, dialogs }));

      await act(async () => {
        await result.current.handleBatchComplete();
      });

      expect(window.location.search).toContain("woId=wo-2");
    });
  });

  describe("mechanic helper handlers", () => {
    it("handleRemoveHelper marks pending, mutates, and clears pending", async () => {
      const markPending = vi.fn();
      const clearPending = vi.fn();
      const { result } = renderBayView(
        makeParams({ markPending, clearPending }),
      );

      await act(async () => {
        await result.current.handleRemoveHelper("wo-1", "mech-2");
      });

      expect(markPending).toHaveBeenCalledWith("wo-1");
      expect(bayMutations.removeHelper.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        mechanicId: "mech-2",
      });
      expect(clearPending).toHaveBeenCalledWith("wo-1");
    });

    it("handleAddHelper marks pending, mutates, and clears pending", async () => {
      const markPending = vi.fn();
      const clearPending = vi.fn();
      const { result } = renderBayView(
        makeParams({ markPending, clearPending }),
      );

      await act(async () => {
        await result.current.handleAddHelper("wo-1", "mech-2");
      });

      expect(markPending).toHaveBeenCalledWith("wo-1");
      expect(bayMutations.addHelper.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        mechanicId: "mech-2",
      });
      expect(clearPending).toHaveBeenCalledWith("wo-1");
    });

    it("handleAssignMechanic marks pending, mutates, and clears pending", async () => {
      const markPending = vi.fn();
      const clearPending = vi.fn();
      const { result } = renderBayView(
        makeParams({ markPending, clearPending }),
      );

      await act(async () => {
        await result.current.handleAssignMechanic("wo-1", "mech-1");
      });

      expect(markPending).toHaveBeenCalledWith("wo-1");
      expect(bayMutations.assignMechanic.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        mechanicId: "mech-1",
      });
      expect(clearPending).toHaveBeenCalledWith("wo-1");
    });

    it("handleRemoveMechanic marks pending, mutates, and clears pending", async () => {
      const markPending = vi.fn();
      const clearPending = vi.fn();
      const { result } = renderBayView(
        makeParams({ markPending, clearPending }),
      );

      await act(async () => {
        await result.current.handleRemoveMechanic("wo-1");
      });

      expect(markPending).toHaveBeenCalledWith("wo-1");
      expect(bayMutations.removeMechanic.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
      });
      expect(clearPending).toHaveBeenCalledWith("wo-1");
    });
  });

  describe("handleReorderMechanics", () => {
    it("does nothing for an empty list", async () => {
      const markPending = vi.fn();
      const { result } = renderBayView(
        makeParams({ markPending, clearPending: vi.fn() }),
      );

      await act(async () => {
        await result.current.handleReorderMechanics("wo-1", []);
      });

      expect(markPending).not.toHaveBeenCalled();
      expect(bayMutations.assignMechanic.mutateAsync).not.toHaveBeenCalled();
    });

    it("assigns the new lead, reorders helpers, and refreshes", async () => {
      const markPending = vi.fn();
      const clearPending = vi.fn();
      const fetchData = vi.fn().mockResolvedValue(undefined);
      const { result } = renderBayView(
        makeParams({ markPending, clearPending, fetchData }),
      );

      await act(async () => {
        await result.current.handleReorderMechanics("wo-1", [
          "mech-a",
          "mech-b",
        ]);
      });

      expect(markPending).toHaveBeenCalledWith("wo-1");
      expect(bayMutations.assignMechanic.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        mechanicId: "mech-a",
      });
      expect(bayActionsMock.reorderWorkOrderHelpers).toHaveBeenCalledWith(
        "wo-1",
        ["mech-b"],
      );
      expect(fetchData).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith("Mechanics reordered");
      expect(clearPending).toHaveBeenCalledWith("wo-1");
    });

    it("skips helper reordering when there is a single mechanic", async () => {
      const { result } = renderBayView(makeParams());

      await act(async () => {
        await result.current.handleReorderMechanics("wo-1", ["mech-a"]);
      });

      expect(bayActionsMock.reorderWorkOrderHelpers).not.toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith("Mechanics reordered");
    });

    it("shows an error toast when the assignment fails", async () => {
      bayMutations.assignMechanic.mutateAsync.mockRejectedValueOnce(
        new Error("boom"),
      );
      const clearPending = vi.fn();
      const { result } = renderBayView(
        makeParams({ clearPending, fetchData: vi.fn() }),
      );

      await act(async () => {
        await result.current.handleReorderMechanics("wo-1", ["mech-a"]);
      });

      expect(toastMock.error).toHaveBeenCalledWith(
        "Failed to reorder mechanics",
      );
      expect(clearPending).toHaveBeenCalledWith("wo-1");
    });
  });

  describe("handleReorderQueue", () => {
    it("persists the new ordering and refreshes data", async () => {
      const fetchData = vi.fn().mockResolvedValue(undefined);
      const { result } = renderBayView(makeParams({ fetchData }));
      const updates = [
        { id: "wq-1", queue_order: 0 },
        { id: "wq-2", queue_order: 1 },
      ];

      await act(async () => {
        await result.current.handleReorderQueue(updates);
      });

      expect(bayActionsMock.reorderQueue).toHaveBeenCalledWith(updates);
      expect(fetchData).toHaveBeenCalled();
    });
  });

  describe("drag handlers", () => {
    it("onDragCancel clears the active drag", () => {
      const setActiveDrag = vi.fn();
      const { result } = renderBayView(makeParams({ setActiveDrag }));

      act(() => result.current.onDragCancel());

      expect(setActiveDrag).toHaveBeenCalledWith(null);
    });

    it("onDragStart sets the active drag with plate and preview bay for a vehicle", () => {
      const setActiveDrag = vi.fn();
      const { result } = renderBayView(makeParams({ setActiveDrag }));

      act(() =>
        result.current.onDragStart(
          dragStartEvent({ type: "vehicle", workOrderId: "wo-1" }),
        ),
      );

      expect(setActiveDrag).toHaveBeenLastCalledWith({
        type: "vehicle",
        label: expect.any(String),
        previewBay: expect.objectContaining({ bayNumber: 1 }),
      });
    });

    it("onDragStart keeps the generic label when the vehicle has no plate", () => {
      const setActiveDrag = vi.fn();
      const data = makeData({
        bays: [
          {
            bayNumber: 1,
            workOrder: makeBayWorkOrder({
              vehicle: { id: "veh-1", plate_number: null },
            }),
          },
        ],
      });
      const { result } = renderBayView(makeParams({ data, setActiveDrag }));

      act(() =>
        result.current.onDragStart(
          dragStartEvent({ type: "vehicle", workOrderId: "wo-1" }),
        ),
      );

      expect(setActiveDrag).toHaveBeenCalledTimes(1);
      expect(setActiveDrag).toHaveBeenCalledWith({
        type: "vehicle",
        label: "Vehicle",
      });
    });

    it("onDragStart sets the mechanic label from the roster", () => {
      const setActiveDrag = vi.fn();
      const { result } = renderBayView(makeParams({ setActiveDrag }));

      act(() =>
        result.current.onDragStart(
          dragStartEvent({ type: "mechanic", mechanicId: "mech-1" }, "mech-1"),
        ),
      );

      expect(setActiveDrag).toHaveBeenLastCalledWith({
        type: "mechanic",
        label: "John Doe",
      });
    });

    it("onDragStart handles mechanic-assigned drags", () => {
      const setActiveDrag = vi.fn();
      const { result } = renderBayView(makeParams({ setActiveDrag }));

      act(() =>
        result.current.onDragStart(
          dragStartEvent(
            { type: "mechanic-assigned", mechanicId: "mech-1" },
            "mech-1",
          ),
        ),
      );

      expect(setActiveDrag).toHaveBeenLastCalledWith({
        type: "mechanic",
        label: "John Doe",
      });
    });

    it("onDragEnd routes kanban status drops through the status handler", async () => {
      const { result } = renderBayView(makeParams());

      await act(async () => {
        result.current.onDragEnd(
          dragEndEvent(
            { type: "vehicle", workOrderId: "wo-1" },
            "kanban-status-In%20Progress",
          ),
        );
      });

      expect(bayMutations.updateStatus.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        status: "In Progress",
      });
    });

    it("onDragEnd removes a mechanic dropped outside any droppable", () => {
      const { result } = renderBayView(makeParams());

      act(() =>
        result.current.onDragEnd(
          dragEndEvent({
            type: "mechanic-assigned",
            mechanicId: "mech-1",
            workOrderId: "wo-1",
          }),
        ),
      );

      expect(bayMutations.removeMechanic.mutate).toHaveBeenCalledWith({
        woId: "wo-1",
      });
    });

    it("onDragEnd assigns a vehicle to an empty bay", () => {
      const { result } = renderBayView(makeParams());

      act(() =>
        result.current.onDragEnd(
          dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "bay-3"),
        ),
      );

      expect(bayMutations.assign.mutate).toHaveBeenCalledWith({
        workOrderId: "wo-1",
        bayNumber: 3,
      });
    });

    it("onDragEnd swaps vehicles when the target bay is occupied", async () => {
      const markPending = vi.fn();
      const clearPending = vi.fn();
      const data = makeData({
        bays: [
          {
            bayNumber: 1,
            workOrder: makeBayWorkOrder(),
          },
          {
            bayNumber: 2,
            workOrder: makeBayWorkOrder({ id: "wo-2", bay_number: 2 }),
          },
        ],
      });
      const { result } = renderBayView(
        makeParams({ data, markPending, clearPending }),
      );

      await act(async () => {
        result.current.onDragEnd(
          dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "bay-2"),
        );
      });

      expect(markPending).toHaveBeenCalledWith("wo-1", "wo-2");
      expect(bayMutations.swap.mutateAsync).toHaveBeenCalledWith({
        woIdA: "wo-1",
        bayNumberA: 1,
        woIdB: "wo-2",
        bayNumberB: 2,
      });
      expect(clearPending).toHaveBeenCalledWith("wo-1", "wo-2");
    });

    it("onDragEnd ignores a drop on the vehicle's own bay", () => {
      const { result } = renderBayView(makeParams());

      act(() =>
        result.current.onDragEnd(
          dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "bay-1"),
        ),
      );

      expect(bayMutations.assign.mutate).not.toHaveBeenCalled();
      expect(bayMutations.swap.mutateAsync).not.toHaveBeenCalled();
    });

    it("onDragEnd moves a bay vehicle back to the waiting queue", () => {
      const { result } = renderBayView(makeParams());

      act(() =>
        result.current.onDragEnd(
          dragEndEvent(
            { type: "vehicle", workOrderId: "wo-1" },
            "waiting-queue",
          ),
        ),
      );

      expect(bayMutations.remove.mutate).toHaveBeenCalledWith({ woId: "wo-1" });
    });

    it("onDragEnd assigns a roster mechanic to a bay work order", () => {
      const { result } = renderBayView(makeParams());

      act(() =>
        result.current.onDragEnd(
          dragEndEvent({ type: "mechanic", mechanicId: "mech-1" }, "bay-1"),
        ),
      );

      expect(bayMutations.assignMechanic.mutate).toHaveBeenCalledWith({
        woId: "wo-1",
        mechanicId: "mech-1",
      });
    });

    it("onDragEnd warns when dropping a mechanic on an empty bay", () => {
      const data = makeData({ bays: [{ bayNumber: 1, workOrder: null }] });
      const { result } = renderBayView(makeParams({ data }));

      act(() =>
        result.current.onDragEnd(
          dragEndEvent({ type: "mechanic", mechanicId: "mech-1" }, "bay-1"),
        ),
      );

      expect(bayMutations.assignMechanic.mutate).not.toHaveBeenCalled();
      expect(toastMock).toHaveBeenCalledWith(
        "Drop the vehicle here first, then assign a mechanic.",
      );
    });

    it("onDragEnd reorders the waiting queue", async () => {
      const data = makeData({
        waitingQueue: [
          makeBayWorkOrder({ id: "wq-1", bay_number: null }),
          makeBayWorkOrder({ id: "wq-2", bay_number: null }),
        ],
      });
      const { result } = renderBayView(makeParams({ data }));

      await act(async () => {
        result.current.onDragEnd(
          dragEndEvent(
            { type: "vehicle", workOrderId: "wq-1" },
            "vehicle-wq-2",
            "wq-1",
          ),
        );
      });

      expect(bayActionsMock.reorderQueue).toHaveBeenCalledWith([
        { id: "wq-2", queue_order: 0 },
        { id: "wq-1", queue_order: 1 },
      ]);
    });
  });
});
