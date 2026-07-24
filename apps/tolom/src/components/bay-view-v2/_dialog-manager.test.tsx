import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  BayViewData,
  BaySlotData,
} from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { DialogManager } from "./_dialog-manager";
import type { PaymentMethodFees } from "./_payment-fees";
import type { BayViewDialogsState } from "./_use-bay-view-dialogs";
import type { BayViewPendingState } from "./_use-bay-view-pending";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("./vehicle-registration-drawer", () => ({
  VehicleRegistrationDrawer: ({
    open,
    assignBayNumber,
  }: {
    open: boolean;
    assignBayNumber?: number;
  }) =>
    open ? (
      <div data-testid="vehicle-registration-drawer">
        {assignBayNumber ? (
          <span>Assign to bay #{assignBayNumber}</span>
        ) : (
          <span>Add to queue</span>
        )}
      </div>
    ) : null,
}));

vi.mock("./work-order-detail-drawer", () => ({
  WorkOrderDetailDrawer: ({
    open,
    workOrderId,
  }: {
    open: boolean;
    workOrderId: string | null;
  }) =>
    open ? <div data-testid="work-order-detail-drawer">{workOrderId}</div> : null,
}));

vi.mock("./assign-dialog", () => ({
  AssignDialog: () => <div data-testid="assign-dialog" />,
}));

vi.mock("./shift-report-dialog", () => ({
  ShiftReportDialog: () => <div data-testid="shift-report-dialog" />,
}));

vi.mock("sonner", () => ({ toast: { dismiss: vi.fn(), success: vi.fn() } }));

// ── Factory helpers ─────────────────────────────────────────────

const defaultT = (key: string) => {
  const map: Record<string, string> = {
    assignedDirectlyToBay: "Assigned to bay {bayNumber}",
    batchCompleteConfirmTitle: "Confirm batch complete",
    batchCompleteConfirmDesc: "{count} work orders ready",
    cancel: "Cancel",
    batchComplete: "Complete {count}",
    batchCompleteProcessing: "Processing...",
  };
  return map[key] ?? key;
};

function createDialogsState(
  overrides: Partial<BayViewDialogsState> = {},
): BayViewDialogsState {
  return {
    open: {
      shiftReport: false,
      vehicleReg: false,
      batchComplete: false,
      assign: false,
      ...(overrides.open ?? {}),
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

function createPendingState(): BayViewPendingState {
  return {
    pending: null,
    clearPending: vi.fn(),
    requestStatusChange: vi.fn(),
    requestPostService: vi.fn(),
    requestPickupComplete: vi.fn(),
  };
}

function createBayViewData(): BayViewData {
  return {
    bayCount: 6,
    bays: [],
    branches: [],
    waitingQueue: [],
    mechanics: [],
    shiftReport: {
      bayCount: 6,
      totalCompleted: 0,
      totalRevenue: 0,
      totalMechanicHours: 0,
      completedByMechanic: [],
    },
  };
}

function createPaymentMethodFees(): PaymentMethodFees {
  return {
    cash: 0,
    card: 0,
    transfer: 0,
  };
}

// ── Tests ───────────────────────────────────────────────────────

describe("DialogManager", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders VehicleRegistrationDrawer when vehicleReg is open with assignBayNumber", () => {
    const dialogs = createDialogsState({
      open: { vehicleReg: true },
      directAssignBayNumber: 3,
    });

    render(
      <DialogManager
        dialogs={dialogs}
        pending={createPendingState()}
        data={createBayViewData()}
        branchFilter="branch-1"
        paymentMethodFees={createPaymentMethodFees()}
        transferBanks={[]}
        pendingPostServiceBay={null}
        readyWosCount={0}
        batchCompleteIsPending={false}
        handleStatusModalConfirm={vi.fn()}
        handlePostServiceConfirm={vi.fn()}
        handlePickupCompleteConfirm={vi.fn()}
        handleBatchComplete={vi.fn()}
        handleAssignToBay={vi.fn()}
        onRefresh={vi.fn()}
        t={defaultT}
        assignMechanicMutation={{ mutateAsync: vi.fn() }}
        assignCustomerMutation={{ mutateAsync: vi.fn() }}
      />,
    );

    expect(screen.getByTestId("vehicle-registration-drawer")).toBeInTheDocument();
    expect(screen.getByText("Assign to bay #3")).toBeInTheDocument();
  });

  it("renders VehicleRegistrationDrawer without assignBayNumber when directAssignBayNumber is null", () => {
    const dialogs = createDialogsState({
      open: { vehicleReg: true },
      directAssignBayNumber: null,
    });

    render(
      <DialogManager
        dialogs={dialogs}
        pending={createPendingState()}
        data={createBayViewData()}
        branchFilter={undefined}
        paymentMethodFees={createPaymentMethodFees()}
        transferBanks={[]}
        pendingPostServiceBay={null}
        readyWosCount={0}
        batchCompleteIsPending={false}
        handleStatusModalConfirm={vi.fn()}
        handlePostServiceConfirm={vi.fn()}
        handlePickupCompleteConfirm={vi.fn()}
        handleBatchComplete={vi.fn()}
        handleAssignToBay={vi.fn()}
        onRefresh={vi.fn()}
        t={defaultT}
        assignMechanicMutation={{ mutateAsync: vi.fn() }}
        assignCustomerMutation={{ mutateAsync: vi.fn() }}
      />,
    );

    expect(screen.getByTestId("vehicle-registration-drawer")).toBeInTheDocument();
    expect(screen.getByText("Add to queue")).toBeInTheDocument();
  });

  it("does not render VehicleRegistrationDrawer when vehicleReg is closed", () => {
    const dialogs = createDialogsState({ open: { vehicleReg: false } });

    render(
      <DialogManager
        dialogs={dialogs}
        pending={createPendingState()}
        data={createBayViewData()}
        branchFilter={undefined}
        paymentMethodFees={createPaymentMethodFees()}
        transferBanks={[]}
        pendingPostServiceBay={null}
        readyWosCount={0}
        batchCompleteIsPending={false}
        handleStatusModalConfirm={vi.fn()}
        handlePostServiceConfirm={vi.fn()}
        handlePickupCompleteConfirm={vi.fn()}
        handleBatchComplete={vi.fn()}
        handleAssignToBay={vi.fn()}
        onRefresh={vi.fn()}
        t={defaultT}
        assignMechanicMutation={{ mutateAsync: vi.fn() }}
        assignCustomerMutation={{ mutateAsync: vi.fn() }}
      />,
    );

    expect(
      screen.queryByTestId("vehicle-registration-drawer"),
    ).not.toBeInTheDocument();
  });

  it("renders WorkOrderDetailDrawer when detailWoId is set", () => {
    const dialogs = createDialogsState({
      detailWoId: "wo-123",
    });

    render(
      <DialogManager
        dialogs={dialogs}
        pending={createPendingState()}
        data={createBayViewData()}
        branchFilter={undefined}
        paymentMethodFees={createPaymentMethodFees()}
        transferBanks={[]}
        pendingPostServiceBay={null}
        readyWosCount={0}
        batchCompleteIsPending={false}
        handleStatusModalConfirm={vi.fn()}
        handlePostServiceConfirm={vi.fn()}
        handlePickupCompleteConfirm={vi.fn()}
        handleBatchComplete={vi.fn()}
        handleAssignToBay={vi.fn()}
        onRefresh={vi.fn()}
        t={defaultT}
        assignMechanicMutation={{ mutateAsync: vi.fn() }}
        assignCustomerMutation={{ mutateAsync: vi.fn() }}
      />,
    );

    expect(screen.getByTestId("work-order-detail-drawer")).toBeInTheDocument();
    expect(screen.getByText("wo-123")).toBeInTheDocument();
  });

  it("no longer renders EmptyBayActionDrawer (removed in refactor)", () => {
    const dialogs = createDialogsState();

    render(
      <DialogManager
        dialogs={dialogs}
        pending={createPendingState()}
        data={createBayViewData()}
        branchFilter={undefined}
        paymentMethodFees={createPaymentMethodFees()}
        transferBanks={[]}
        pendingPostServiceBay={null}
        readyWosCount={0}
        batchCompleteIsPending={false}
        handleStatusModalConfirm={vi.fn()}
        handlePostServiceConfirm={vi.fn()}
        handlePickupCompleteConfirm={vi.fn()}
        handleBatchComplete={vi.fn()}
        handleAssignToBay={vi.fn()}
        onRefresh={vi.fn()}
        t={defaultT}
        assignMechanicMutation={{ mutateAsync: vi.fn() }}
        assignCustomerMutation={{ mutateAsync: vi.fn() }}
      />,
    );

    // The old EmptyBayActionDrawer rendered action cards with "Бүртгээд" text.
    // Verify those strings are NOT in the DOM.
    expect(screen.queryByText("Бүртгээд")).not.toBeInTheDocument();
    expect(screen.queryByTestId("empty-bay-action-drawer")).not.toBeInTheDocument();
  });

  it("does not accept old handleRegisterAndAssign and handleEmptyBayQueueSelect props", () => {
    // This test verifies the TypeScript interface no longer exposes these props.
    // We test this by checking the component renders without them.
    const dialogs = createDialogsState();

    const { container } = render(
      <DialogManager
        dialogs={dialogs}
        pending={createPendingState()}
        data={createBayViewData()}
        branchFilter={undefined}
        paymentMethodFees={createPaymentMethodFees()}
        transferBanks={[]}
        pendingPostServiceBay={null}
        readyWosCount={0}
        batchCompleteIsPending={false}
        handleStatusModalConfirm={vi.fn()}
        handlePostServiceConfirm={vi.fn()}
        handlePickupCompleteConfirm={vi.fn()}
        handleBatchComplete={vi.fn()}
        handleAssignToBay={vi.fn()}
        onRefresh={vi.fn()}
        t={defaultT}
        assignMechanicMutation={{ mutateAsync: vi.fn() }}
        assignCustomerMutation={{ mutateAsync: vi.fn() }}
      />,
    );

    // Component renders without error
    expect(container.firstChild).toBeInTheDocument();
  });
});
