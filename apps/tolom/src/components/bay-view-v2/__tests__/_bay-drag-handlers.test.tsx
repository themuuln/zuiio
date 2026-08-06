import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BaySlotData, BayViewData } from "@/lib/services/bay-view-service";
import { useBayDragHandlers } from "../_bay-drag-handlers";

const { toastFn, toastError, toastDismiss, reportServerError } = vi.hoisted(
  () => ({
    toastFn: vi.fn(),
    toastError: vi.fn(),
    toastDismiss: vi.fn(),
    reportServerError: vi.fn(),
  }),
);

vi.mock("sonner", () => ({
  toast: Object.assign(toastFn, {
    error: toastError,
    dismiss: toastDismiss,
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError,
}));

function makeWorkOrder(
  id: string,
  status: string,
  mechanicId: string | null,
  helperIds: string[] = [],
) {
  return {
    id,
    status,
    bay_number: 1,
    mechanic_id: mechanicId,
    vehicle: { id: `veh-${id}`, plate_number: `PLATE-${id}` },
    mechanic: mechanicId
      ? { id: mechanicId, full_name: null, avatar_url: null }
      : null,
    helpers: helperIds.map((h) => ({
      id: h,
      full_name: null,
      avatar_url: null,
    })),
    customer_name: null,
  } as unknown as NonNullable<BaySlotData["workOrder"]>;
}

function makeQueueItem(id: string, queueOrder: number) {
  return {
    id,
    queue_order: queueOrder,
    status: "New",
    bay_number: null,
    mechanic_id: null,
    vehicle: null,
  } as unknown as BayViewData["waitingQueue"][number];
}

function makeData(): BayViewData {
  return {
    bayCount: 3,
    bays: [
      {
        bayNumber: 1,
        workOrder: makeWorkOrder("wo-1", "In Progress", "mech-1", ["mech-2"]),
      },
      {
        bayNumber: 2,
        workOrder: makeWorkOrder("wo-2", "Diagnosing", null),
      },
      { bayNumber: 3, workOrder: null },
    ],
    branches: [],
    waitingQueue: [makeQueueItem("wo-q1", 0), makeQueueItem("wo-q2", 1)],
    mechanics: [],
    shiftReport: {
      completedToday: 0,
      revenueToday: 0,
      avgDurationMinutes: 0,
      bayUtilization: 0,
      bayCount: 3,
      activeJobs: 2,
      revenuePerLaborHour: 0,
    },
  };
}

function dragStartEvent(activeData: unknown): DragStartEvent {
  return {
    active: { id: "active-1", data: { current: activeData } },
  } as unknown as DragStartEvent;
}

function dragEndEvent(
  activeData: unknown,
  overId: string | null,
): DragEndEvent {
  return {
    active: { id: "active-1", data: { current: activeData } },
    over: overId === null ? null : { id: overId },
  } as unknown as DragEndEvent;
}

function setup(data: BayViewData | null = makeData()) {
  const setActiveDrag = vi.fn();
  const onStatusChange = vi.fn();
  const assignMechanic = vi.fn();
  const removeMechanic = vi.fn();
  const addHelper = vi.fn();
  const assignToBay = vi.fn();
  const removeFromBay = vi.fn();
  const onSwapBays = vi.fn().mockResolvedValue(undefined);
  const onReorderQueue = vi.fn().mockResolvedValue(undefined);
  const markPending = vi.fn();
  const clearPending = vi.fn();

  const { result } = renderHook(() =>
    useBayDragHandlers({
      data,
      setActiveDrag,
      onStatusChange,
      assignMechanic,
      removeMechanic,
      addHelper,
      assignToBay,
      removeFromBay,
      onSwapBays,
      onReorderQueue,
      markPending,
      clearPending,
    }),
  );

  return {
    result,
    setActiveDrag,
    onStatusChange,
    assignMechanic,
    removeMechanic,
    addHelper,
    assignToBay,
    removeFromBay,
    onSwapBays,
    onReorderQueue,
    markPending,
    clearPending,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBayDragHandlers — handleDragStart", () => {
  it("sets active drag for vehicle type", () => {
    const { result, setActiveDrag } = setup();
    result.current.handleDragStart(
      dragStartEvent({ type: "vehicle", workOrderId: "wo-1" }),
    );
    expect(setActiveDrag).toHaveBeenCalledWith({
      type: "vehicle",
      label: "Vehicle",
    });
  });

  it("sets active drag for mechanic type", () => {
    const { result, setActiveDrag } = setup();
    result.current.handleDragStart(
      dragStartEvent({ type: "mechanic", mechanicId: "mech-1" }),
    );
    expect(setActiveDrag).toHaveBeenCalledWith({
      type: "mechanic",
      label: "Mechanic",
    });
  });

  it("sets active drag for mechanic-assigned type", () => {
    const { result, setActiveDrag } = setup();
    result.current.handleDragStart(
      dragStartEvent({
        type: "mechanic-assigned",
        mechanicId: "mech-1",
        workOrderId: "wo-1",
      }),
    );
    expect(setActiveDrag).toHaveBeenCalledWith({
      type: "mechanic-assigned",
      label: "Mechanic",
    });
  });

  it("ignores unknown drag types", () => {
    const { result, setActiveDrag } = setup();
    result.current.handleDragStart(dragStartEvent({ type: "bogus" }));
    expect(setActiveDrag).not.toHaveBeenCalled();
  });
});

describe("useBayDragHandlers — handleDragEnd", () => {
  it("clears active drag on every drag end", () => {
    const { result, setActiveDrag } = setup();
    result.current.handleDragEnd(dragEndEvent({ type: "vehicle" }, "bay-3"));
    expect(setActiveDrag).toHaveBeenCalledWith(null);
  });

  it("removes an assigned mechanic when dropped outside any droppable", () => {
    const { result, removeMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        {
          type: "mechanic-assigned",
          mechanicId: "mech-1",
          workOrderId: "wo-1",
        },
        null,
      ),
    );
    expect(removeMechanic).toHaveBeenCalledWith({ woId: "wo-1" });
  });

  it("does nothing when a vehicle is dropped outside any droppable", () => {
    const { result, removeMechanic, assignToBay, removeFromBay } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, null),
    );
    expect(removeMechanic).not.toHaveBeenCalled();
    expect(assignToBay).not.toHaveBeenCalled();
    expect(removeFromBay).not.toHaveBeenCalled();
  });

  it("changes kanban status when vehicle is dropped on a status column", () => {
    const { result, onStatusChange } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        { type: "vehicle", workOrderId: "wo-1" },
        "kanban-status-Completed",
      ),
    );
    expect(onStatusChange).toHaveBeenCalledWith("wo-1", "Completed");
  });

  it("ignores kanban status drop when status is unchanged", () => {
    const { result, onStatusChange } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        { type: "vehicle", workOrderId: "wo-1" },
        "kanban-status-In%20Progress",
      ),
    );
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("ignores kanban status drop when vehicle is not in any bay", () => {
    const { result, onStatusChange } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        { type: "vehicle", workOrderId: "wo-unknown" },
        "kanban-status-Completed",
      ),
    );
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("does nothing when a vehicle is dropped on its own bay", () => {
    const { result, assignToBay, onSwapBays } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "bay-1"),
    );
    expect(assignToBay).not.toHaveBeenCalled();
    expect(onSwapBays).not.toHaveBeenCalled();
  });

  it("swaps vehicles atomically when the target bay is occupied", async () => {
    const { result, onSwapBays, markPending, clearPending } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "bay-2"),
    );
    expect(markPending).toHaveBeenCalledWith("wo-1", "wo-2");
    expect(onSwapBays).toHaveBeenCalledWith("wo-1", 1, "wo-2", 2);
    await vi.waitFor(() =>
      expect(clearPending).toHaveBeenCalledWith("wo-1", "wo-2"),
    );
  });

  it("reports swap failures but still clears pending state", async () => {
    const swapError = new Error("swap boom");
    const { result, onSwapBays, clearPending, markPending } = setup();
    onSwapBays.mockRejectedValue(swapError);
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "bay-2"),
    );
    expect(markPending).toHaveBeenCalledWith("wo-1", "wo-2");
    await vi.waitFor(() =>
      expect(reportServerError).toHaveBeenCalledWith(
        "Bay swap failed",
        swapError,
      ),
    );
    expect(clearPending).toHaveBeenCalledWith("wo-1", "wo-2");
  });

  it("assigns a vehicle to an empty bay", () => {
    const { result, assignToBay } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "bay-3"),
    );
    expect(assignToBay).toHaveBeenCalledWith({
      workOrderId: "wo-1",
      bayNumber: 3,
    });
  });

  it("assigns instead of swapping when the source vehicle is not in a bay", () => {
    const { result, assignToBay, onSwapBays } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-new" }, "bay-2"),
    );
    expect(assignToBay).toHaveBeenCalledWith({
      workOrderId: "wo-new",
      bayNumber: 2,
    });
    expect(onSwapBays).not.toHaveBeenCalled();
  });

  it("removes a vehicle from its bay when dropped on the waiting queue", () => {
    const { result, removeFromBay } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "waiting-queue"),
    );
    expect(removeFromBay).toHaveBeenCalledWith({ woId: "wo-1" });
  });

  it("removes a vehicle from its bay when dropped on a queue vehicle", () => {
    const { result, removeFromBay } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "vehicle-wo-q1"),
    );
    expect(removeFromBay).toHaveBeenCalledWith({ woId: "wo-1" });
  });

  it("shows a toast when a mechanic is dropped on an empty bay", () => {
    const { result, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "mechanic", mechanicId: "mech-1" }, "bay-3"),
    );
    expect(toastFn).toHaveBeenCalledWith(
      "Drop the vehicle here first, then assign a mechanic.",
    );
    expect(assignMechanic).not.toHaveBeenCalled();
  });

  it("assigns a mechanic as main mechanic when the bay has none", () => {
    const { result, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "mechanic", mechanicId: "mech-1" }, "bay-2"),
    );
    expect(assignMechanic).toHaveBeenCalledWith({
      woId: "wo-2",
      mechanicId: "mech-1",
    });
  });

  it("adds a mechanic as helper when the bay already has a main mechanic", () => {
    const { result, addHelper, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "mechanic", mechanicId: "mech-9" }, "bay-1"),
    );
    expect(addHelper).toHaveBeenCalledWith({
      woId: "wo-1",
      mechanicId: "mech-9",
    });
    expect(assignMechanic).not.toHaveBeenCalled();
  });

  it("is a no-op when the mechanic is already a helper on the target bay", () => {
    const { result, addHelper, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "mechanic", mechanicId: "mech-2" }, "bay-1"),
    );
    expect(addHelper).not.toHaveBeenCalled();
    expect(assignMechanic).not.toHaveBeenCalled();
  });

  it("assigns a mechanic to a work order via vehicle drop id", () => {
    const { result, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "mechanic", mechanicId: "mech-1" }, "vehicle-wo-2"),
    );
    expect(assignMechanic).toHaveBeenCalledWith({
      woId: "wo-2",
      mechanicId: "mech-1",
    });
  });

  it("assigns a mechanic to a work order via mechanic-on-wo drop id", () => {
    const { result, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        { type: "mechanic", mechanicId: "mech-1" },
        "mechanic-on-wo-wo-2",
      ),
    );
    expect(assignMechanic).toHaveBeenCalledWith({
      woId: "wo-2",
      mechanicId: "mech-1",
    });
  });

  it("ignores mechanic drops without a mechanicId or unknown targets", () => {
    const { result, assignMechanic, addHelper } = setup();
    result.current.handleDragEnd(dragEndEvent({ type: "mechanic" }, "bay-2"));
    result.current.handleDragEnd(
      dragEndEvent({ type: "mechanic", mechanicId: "mech-1" }, "unrelated-id"),
    );
    expect(assignMechanic).not.toHaveBeenCalled();
    expect(addHelper).not.toHaveBeenCalled();
  });

  it("unassigns an assigned mechanic dropped on the mechanic roster", () => {
    const { result, removeMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        {
          type: "mechanic-assigned",
          mechanicId: "mech-1",
          workOrderId: "wo-1",
        },
        "mechanic-roster",
      ),
    );
    expect(removeMechanic).toHaveBeenCalledWith({ woId: "wo-1" });
  });

  it("reassigns an assigned mechanic to another work order via vehicle id", () => {
    const { result, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        {
          type: "mechanic-assigned",
          mechanicId: "mech-1",
          workOrderId: "wo-1",
        },
        "vehicle-wo-2",
      ),
    );
    expect(assignMechanic).toHaveBeenCalledWith({
      woId: "wo-2",
      mechanicId: "mech-1",
    });
  });

  it("reassigns an assigned mechanic to another bay's work order", () => {
    const { result, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        {
          type: "mechanic-assigned",
          mechanicId: "mech-1",
          workOrderId: "wo-1",
        },
        "bay-2",
      ),
    );
    expect(assignMechanic).toHaveBeenCalledWith({
      woId: "wo-2",
      mechanicId: "mech-1",
    });
  });

  it("is a no-op when an assigned mechanic is dropped on its own vehicle or bay", () => {
    const { result, assignMechanic, removeMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        {
          type: "mechanic-assigned",
          mechanicId: "mech-1",
          workOrderId: "wo-1",
        },
        "vehicle-wo-1",
      ),
    );
    result.current.handleDragEnd(
      dragEndEvent(
        {
          type: "mechanic-assigned",
          mechanicId: "mech-1",
          workOrderId: "wo-1",
        },
        "bay-1",
      ),
    );
    expect(assignMechanic).not.toHaveBeenCalled();
    expect(removeMechanic).not.toHaveBeenCalled();
  });

  it("shows a toast when an assigned mechanic is dropped on an empty bay", () => {
    const { result, assignMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        {
          type: "mechanic-assigned",
          mechanicId: "mech-1",
          workOrderId: "wo-1",
        },
        "bay-3",
      ),
    );
    expect(toastFn).toHaveBeenCalledWith(
      "Drop the vehicle here first, then reassign the mechanic.",
    );
    expect(assignMechanic).not.toHaveBeenCalled();
  });

  it("ignores mechanic-assigned drops without a mechanicId", () => {
    const { result, assignMechanic, removeMechanic } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        { type: "mechanic-assigned", workOrderId: "wo-1" },
        "vehicle-wo-2",
      ),
    );
    expect(assignMechanic).not.toHaveBeenCalled();
    expect(removeMechanic).not.toHaveBeenCalled();
  });

  it("reorders the waiting queue and persists the new ordering", async () => {
    const { result, onReorderQueue } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-q1" }, "vehicle-wo-q2"),
    );
    expect(onReorderQueue).toHaveBeenCalledWith([
      { id: "wo-q2", queue_order: 0 },
      { id: "wo-q1", queue_order: 1 },
    ]);
    await vi.waitFor(() => expect(reportServerError).not.toHaveBeenCalled());
    expect(toastError).not.toHaveBeenCalled();
  });

  it("shows an error toast when the queue reorder fails", async () => {
    const reorderError = new Error("reorder boom");
    const { result, onReorderQueue } = setup();
    onReorderQueue.mockRejectedValue(reorderError);
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-q1" }, "vehicle-wo-q2"),
    );
    await vi.waitFor(() =>
      expect(reportServerError).toHaveBeenCalledWith(
        "Re-order failed:",
        reorderError,
      ),
    );
    expect(toastDismiss).toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      "Re-order failed — please try again",
    );
  });

  it("is a no-op when a queue vehicle is dropped on itself", () => {
    const { result, onReorderQueue } = setup();
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-q1" }, "vehicle-wo-q1"),
    );
    expect(onReorderQueue).not.toHaveBeenCalled();
  });

  it("is a no-op when the queue vehicle is not found in the queue", () => {
    const { result, onReorderQueue } = setup();
    result.current.handleDragEnd(
      dragEndEvent(
        { type: "vehicle", workOrderId: "wo-unknown" },
        "vehicle-wo-q2",
      ),
    );
    expect(onReorderQueue).not.toHaveBeenCalled();
  });

  it("handles null data gracefully", () => {
    const { result, assignToBay, removeFromBay, onReorderQueue } = setup(null);
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "bay-3"),
    );
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-1" }, "waiting-queue"),
    );
    result.current.handleDragEnd(
      dragEndEvent({ type: "vehicle", workOrderId: "wo-q1" }, "vehicle-wo-q2"),
    );
    expect(assignToBay).toHaveBeenCalledWith({
      workOrderId: "wo-1",
      bayNumber: 3,
    });
    expect(removeFromBay).not.toHaveBeenCalled();
    expect(onReorderQueue).not.toHaveBeenCalled();
  });
});
