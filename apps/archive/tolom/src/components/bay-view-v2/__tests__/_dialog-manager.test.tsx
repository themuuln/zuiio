import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BayViewData } from "@/lib/services/bay-view-service";
import { render } from "@/test/test-utils";
import { DialogManager } from "../_dialog-manager";
import type { BayViewDialogsState } from "../_use-bay-view-dialogs";
import type { BayViewPendingState } from "../_use-bay-view-pending";

const tMock = vi.hoisted(() => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}[${Object.values(params).join("|")}]` : key,
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => tMock.t,
  };
});

vi.mock("@/components/ui/detail-drawer", () => ({
  DetailDrawer: Object.assign(
    ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div data-testid="detail-drawer">{children}</div> : null,
    {
      Header: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-header">{children}</div>
      ),
      Title: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-title">{children}</div>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-description">{children}</div>
      ),
      Body: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-body">{children}</div>
      ),
      Footer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer">{children}</div>
      ),
      FooterActions: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer-actions">{children}</div>
      ),
    },
  ),
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-08-09T10:00:00"),
}));

vi.mock("@/components/ui/appointment-date-picker", () => ({
  AppointmentDatePicker: () => (
    <div data-testid="appointment-date-picker">date picker</div>
  ),
}));

vi.mock("../work-order-detail-drawer", () => ({
  WorkOrderDetailDrawer: ({
    open,
    onOpenChange,
    workOrderId,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workOrderId: string | null;
  }) => (
    <div data-testid="wo-drawer">
      <span>
        {open ? "open" : "closed"}:{workOrderId ?? "null"}
      </span>
      <button onClick={() => onOpenChange(false)} type="button">
        close-drawer
      </button>
    </div>
  ),
}));

vi.mock("../vehicle-registration-drawer", () => ({
  VehicleRegistrationDrawer: ({
    assignBayNumber,
    onQueued,
    onAssigned,
  }: {
    assignBayNumber?: number;
    onQueued?: () => void;
    onAssigned?: () => void;
  }) => (
    <div data-testid="vehicle-reg">
      <span>bay:{String(assignBayNumber ?? "")}</span>
      <button onClick={() => onQueued?.()} type="button">
        queued
      </button>
      <button onClick={() => onAssigned?.()} type="button">
        assigned
      </button>
    </div>
  ),
}));

vi.mock("../assign-dialog", () => ({
  AssignDialog: ({ open, bayNumber }: { open: boolean; bayNumber: number }) => (
    <div data-testid="assign-dialog">
      bay:{bayNumber}:{open ? "open" : "closed"}
    </div>
  ),
}));

vi.mock("../shift-report-dialog", () => ({
  ShiftReportDialog: ({ open }: { open: boolean }) => (
    <div data-testid="shift-report">{open ? "open" : "closed"}</div>
  ),
}));

vi.mock("../post-service-dialog", () => ({
  PostServiceDialog: () => null,
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: toastMock }));

const handleStatusModalConfirm = vi.fn();
const handlePostServiceConfirm = vi.fn();
const handlePickupCompleteConfirm = vi.fn().mockResolvedValue(undefined);
const handleBatchComplete = vi.fn().mockResolvedValue(undefined);
const handleAssignToBay = vi.fn();
const onRefresh = vi.fn();

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

function makePending(
  pending: BayViewPendingState["pending"],
  clearPending = vi.fn(),
): BayViewPendingState {
  return {
    pending,
    clearPending,
    requestStatusChange: vi.fn(),
    requestPostService: vi.fn(),
    requestPickupComplete: vi.fn(),
  };
}

function renderManager(
  dialogs: BayViewDialogsState,
  pending: BayViewPendingState,
  data: BayViewData | null = null,
) {
  return render(
    <DialogManager
      dialogs={dialogs}
      pending={pending}
      data={data}
      branchFilter="b1"
      paymentMethodFees={{}}
      transferBanks={[]}
      pendingPostServiceBay={null}
      readyWosCount={2}
      batchCompleteIsPending={false}
      handleStatusModalConfirm={handleStatusModalConfirm}
      handlePostServiceConfirm={handlePostServiceConfirm}
      handlePickupCompleteConfirm={handlePickupCompleteConfirm}
      handleBatchComplete={handleBatchComplete}
      handleAssignToBay={handleAssignToBay}
      onRefresh={onRefresh}
      t={(key: string, params?: Record<string, string | number | Date>) =>
        params ? `${key}[${Object.values(params).join("|")}]` : key
      }
      assignMechanicMutation={{
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      }}
      assignCustomerMutation={{
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      }}
      addHelperMutation={{
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      }}
      removeHelperMutation={{
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      }}
      removeMechanicMutation={{
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      }}
    />,
  );
}

describe("DialogManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing interactive when every dialog is closed", () => {
    renderManager(makeDialogs(), makePending(null));
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
    expect(screen.queryByText("Assign to Bay")).not.toBeInTheDocument();
  });

  it("wires the status notes modal to the confirm handler", async () => {
    const user = userEvent.setup();
    renderManager(
      makeDialogs(),
      makePending({ type: "status", woId: "wo-1", status: "Completed" }),
    );

    expect(
      screen.getAllByText("statusNotesCompleteTitle").length,
    ).toBeGreaterThanOrEqual(2);
    await user.type(screen.getByPlaceholderText("notePlaceholder"), "All done");
    await user.click(
      screen.getByRole("button", { name: "statusNotesCompleteTitle" }),
    );

    // The notes input is registered with react-hook-form via its ref, so
    // the typed value reaches the confirm handler.
    expect(handleStatusModalConfirm).toHaveBeenCalledWith(
      "wo-1",
      "Completed",
      "All done",
    );
  });

  it("clears the pending status when the modal is cancelled", async () => {
    const clearPending = vi.fn();
    const user = userEvent.setup();
    renderManager(
      makeDialogs(),
      makePending(
        { type: "status", woId: "wo-1", status: "Cancelled" },
        clearPending,
      ),
    );

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(clearPending).toHaveBeenCalledTimes(1);
  });

  it("wires the pickup complete dialog to the confirm handler", async () => {
    const user = userEvent.setup();
    renderManager(
      makeDialogs(),
      makePending({
        type: "pickupComplete",
        woId: "wo-1",
        vehicleId: "v1",
        vehiclePlate: "ABC 1234",
        newStatus: "Completed",
        totalCost: 50000,
      }),
    );

    expect(screen.getByText("ABC 1234")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "skipReview" }));

    expect(handlePickupCompleteConfirm).toHaveBeenCalledWith({
      customerSatisfaction: null,
      customerFeedback: "",
      nextAppointmentDate: null,
    });
  });

  it("runs the batch complete action from the confirmation dialog", async () => {
    const dialogs = makeDialogs();
    dialogs.open.batchComplete = true;
    const user = userEvent.setup();
    renderManager(dialogs, makePending(null));

    expect(screen.getByText("batchCompleteConfirmTitle")).toBeInTheDocument();
    expect(screen.getByText("batchCompleteConfirmDesc[2]")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "batchComplete[2]" }));

    expect(dialogs.hide).toHaveBeenCalledWith("batchComplete");
    expect(handleBatchComplete).toHaveBeenCalledTimes(1);
  });

  it("wires vehicle registration queue success to hide + toast", async () => {
    const dialogs = makeDialogs();
    dialogs.open.vehicleReg = true;
    const user = userEvent.setup();
    renderManager(dialogs, makePending(null));

    expect(screen.getByTestId("vehicle-reg")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "queued" }));

    expect(dialogs.hide).toHaveBeenCalledWith("vehicleReg");
    expect(toastMock.success).toHaveBeenCalledWith("Added to waiting queue");
  });

  it("wires vehicle registration direct-assign success and clears the bay number", async () => {
    const dialogs = makeDialogs({
      open: { ...makeDialogs().open, vehicleReg: true },
      directAssignBayNumber: 5,
    });
    const user = userEvent.setup();
    renderManager(dialogs, makePending(null));

    expect(screen.getByText("bay:5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "assigned" }));

    expect(dialogs.hide).toHaveBeenCalledWith("vehicleReg");
    expect(dialogs.setDirectAssignBayNumber).toHaveBeenCalledWith(null);
    expect(toastMock.success).toHaveBeenCalledWith("assignedDirectlyToBay[5]");
  });

  it("forwards the assign bay number to the assign dialog", () => {
    const dialogs = makeDialogs({ assignBay: 3 });
    dialogs.open.assign = true;
    renderManager(dialogs, makePending(null));

    expect(screen.getByText("bay:3:open")).toBeInTheDocument();
  });

  it("closes the work order drawer and clears the woId from the URL", () => {
    const dialogs = makeDialogs({ detailWoId: "wo-1" });
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    renderManager(dialogs, makePending(null));

    expect(screen.getByText("open:wo-1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "close-drawer" }));
    expect(dialogs.closeDetail).toHaveBeenCalledTimes(1);
    expect(replaceStateSpy).toHaveBeenCalled();
  });

  it("renders the shift report dialog when opened", () => {
    const dialogs = makeDialogs();
    dialogs.open.shiftReport = true;
    renderManager(dialogs, makePending(null));

    expect(screen.getByText("open")).toBeInTheDocument();
  });
});
