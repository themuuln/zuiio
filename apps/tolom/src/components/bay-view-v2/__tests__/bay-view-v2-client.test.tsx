import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BayViewData } from "@/lib/services/bay-view-service";
import { render } from "@/test/test-utils";
import { BayViewV2Client } from "../bay-view-v2-client";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// ── DnD ────────────────────────────────────────────────────────
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: (s: unknown) => s,
  useSensors: (...s: unknown[]) => s,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

// ── Hooks ──────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  useBayViewData: vi.fn(),
  useBayViewMutations: vi.fn(),
  useBayCountMutation: vi.fn(),
  fetchData: vi.fn(),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" } }),
}));

vi.mock("@/lib/queries/use-org-settings", () => ({
  useOrgSettings: () => ({ settings: {} }),
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => "all",
  useSetSelectedBranchId: vi.fn(),
}));

vi.mock("@/lib/payments/org-bank-accounts", () => ({
  normalizeOrgTransferBankAccounts: (v: unknown) => v,
  resolveOrgTransferBanks: () => [],
}));

vi.mock("@/components/bay-view-v2/_payment-fees", () => ({
  resolvePaymentMethodFees: () => [],
}));

vi.mock("@/lib/queries/use-drawer-queries", () => ({
  prefetchDrawerCatalogs: vi.fn(),
}));

vi.mock("@/components/bay-view-v2/_use-bay-view-data", () => ({
  useBayViewData: mocks.useBayViewData,
}));

vi.mock("@/components/bay-view-v2/_use-bay-view-mutations", () => ({
  useBayViewMutations: mocks.useBayViewMutations,
}));

vi.mock("@/components/bay-view-v2/_use-bay-count-mutation", () => ({
  useBayCountMutation: mocks.useBayCountMutation,
}));

vi.mock("@/components/bay-view-v2/_dialog-manager", () => ({
  DialogManager: () => null,
}));

vi.mock("@/components/bay-view-v2/_toolbar", () => ({
  Toolbar: () => <div data-testid="toolbar">toolbar</div>,
}));

vi.mock("@/components/mechanic-avatar", () => ({
  MechanicAvatar: () => <span data-testid="mechanic-avatar" />,
}));

vi.mock("@/components/mechanic-avatar-chip", () => ({
  MechanicAvatarChip: () => <span data-testid="mechanic-chip" />,
}));

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: () => null,
}));

function makeData(): BayViewData {
  return {
    bayCount: 2,
    bays: [
      {
        bayNumber: 1,
        workOrder: {
          id: "wo-1",
          bay_number: 1,
          mechanic_id: null,
          status: "In Progress",
          started_at: "2026-08-09T09:00:00Z",
          vehicle: {
            id: "v-1",
            plate_number: "1234УБА",
            make: "Toyota",
            model: "Prius",
            year: 2020,
          } as BayViewData["bays"][number]["workOrder"] extends infer T
            ? NonNullable<T>["vehicle"]
            : never,
          mechanic: null,
          helpers: [],
          customer_name: "Дорж",
        },
      },
      { bayNumber: 2, workOrder: null },
    ],
    branches: [],
    waitingQueue: [
      {
        id: "wo-q-1",
        bay_number: null,
        mechanic_id: null,
        status: "New",
        created_at: "2026-08-09T09:00:00Z",
        vehicle: {
          id: "v-q",
          plate_number: "9999УБА",
          make: "Honda",
          model: "Fit",
          year: 2019,
        },
      } as BayViewData["waitingQueue"][number],
    ],
    mechanics: [],
    shiftReport: {
      completedToday: 3,
      revenueToday: 300000,
      avgDurationMinutes: 80,
      bayUtilization: 50,
      bayCount: 2,
      activeJobs: 1,
      revenuePerLaborHour: 15000,
    },
  };
}

function dataHookResult(overrides: Record<string, unknown> = {}) {
  return {
    data: makeData(),
    loading: false,
    error: null,
    isAccessDenied: false,
    fetchData: mocks.fetchData,
    viewMode: "grid",
    setViewMode: vi.fn(),
    userIsMechanic: false,
    myJobsOnly: false,
    setMyJobsOnly: vi.fn(),
    baySearchQuery: "",
    setBaySearchQuery: vi.fn(),
    readyWosCount: 0,
    pendingWoIds: {},
    markPending: vi.fn(),
    clearPending: vi.fn(),
    setActiveDrag: vi.fn(),
    activeDrag: null,
    shiftReport: makeData().shiftReport,
    trendDelta: null,
    occupiedBays: 1,
    searchedBranchSections: undefined,
    searchedBays: makeData().bays,
    filteredQueue: makeData().waitingQueue,
    statusFilter: null,
    setStatusFilter: vi.fn(),
    ...overrides,
  };
}

function mutationsResult() {
  return {
    updateBayCountMutation: { mutateAsync: vi.fn(), isPending: false },
    batchCompleteMutation: { isPending: false },
    assignMechanicMutation: {},
    assignCustomerMutation: {},
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onDragCancel: vi.fn(),
    handleOpenDetail: vi.fn(),
    handleStatusClick: vi.fn(),
    handleRemoveFromBay: vi.fn(),
    handleEmptyBayClick: vi.fn(),
    handleQueueItemClick: vi.fn(),
    handleRemoveHelper: vi.fn(),
    handleAssignMechanic: vi.fn(),
    handleRemoveMechanic: vi.fn(),
    handleAddHelper: vi.fn(),
    handleReorderMechanics: vi.fn(),
    handleStatusModalConfirm: vi.fn(),
    handlePostServiceConfirm: vi.fn(),
    handlePickupCompleteConfirm: vi.fn(),
    handleBatchComplete: vi.fn(),
    handleAssignToBay: vi.fn(),
  };
}

function bayCountResult() {
  return {
    inFlightRef: { current: false },
    pending: false,
    inputValue: 2,
    setInputValue: vi.fn(),
    apply: vi.fn(),
  };
}

describe("BayViewV2Client", () => {
  it("renders skeletons while loading", () => {
    mocks.useBayViewData.mockReturnValue(
      dataHookResult({ data: undefined, loading: true, error: null }),
    );
    mocks.useBayViewMutations.mockReturnValue(mutationsResult());
    mocks.useBayCountMutation.mockReturnValue(bayCountResult());
    render(<BayViewV2Client />);
    // Toolbar + KPI + bay-grid skeletons
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("renders bays, KPIs and the waiting queue", async () => {
    mocks.useBayViewData.mockReturnValue(dataHookResult());
    mocks.useBayViewMutations.mockReturnValue(mutationsResult());
    mocks.useBayCountMutation.mockReturnValue(bayCountResult());
    render(<BayViewV2Client />);
    await waitFor(() => expect(screen.getByText("BAY 01")).toBeTruthy());
    expect(screen.getByText("1234")).toBeTruthy();
    expect(screen.getByText("Дорж")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
    // Queue rail renders queued vehicle
    expect(screen.getByText("9999 УБА")).toBeTruthy();
  });

  it("shows the access denied banner and retries", async () => {
    mocks.useBayViewData.mockReturnValue(
      dataHookResult({ isAccessDenied: true }),
    );
    mocks.useBayViewMutations.mockReturnValue(mutationsResult());
    mocks.useBayCountMutation.mockReturnValue(bayCountResult());
    render(<BayViewV2Client />);
    expect(screen.getByText(/accessDenied/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(mocks.fetchData).toHaveBeenCalledTimes(1);
  });

  it("shows the generic error banner when loading fails", async () => {
    mocks.useBayViewData.mockReturnValue(
      dataHookResult({
        data: undefined,
        loading: false,
        error: new Error("boom"),
      }),
    );
    mocks.useBayViewMutations.mockReturnValue(mutationsResult());
    mocks.useBayCountMutation.mockReturnValue(bayCountResult());
    render(<BayViewV2Client />);
    expect(screen.getByText(/Couldn't load bay view/)).toBeTruthy();
  });
});
