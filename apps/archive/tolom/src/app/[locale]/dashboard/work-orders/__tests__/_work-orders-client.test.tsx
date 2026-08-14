import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkOrderListItem } from "@/lib/queries/use-work-orders";
import { render } from "@/test/test-utils";
import WorkOrdersPage from "../_work-orders-client";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useWorkOrders: vi.fn(),
  useUpdateWorkOrderStatus: vi.fn(),
  useCurrentOrg: vi.fn(),
  useOrgMutation: vi.fn(),
  useIsFirstLoad: vi.fn(),
  mutate: vi.fn(),
  updateStatusMutate: vi.fn(),
  refetch: vi.fn(),
  setDetailWorkOrderId: vi.fn(),
  setNewWorkOrderSheetOpen: vi.fn(),
  setSearch: vi.fn(),
  setStatus: vi.fn(),
}));

const filterState = vi.hoisted(() => ({ search: "", status: "" }));

// ── Module mocks ────────────────────────────────────────────────────
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: mocks.useOrgMutation,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));

vi.mock("@/lib/queries/use-work-orders", () => ({
  useWorkOrders: mocks.useWorkOrders,
}));

vi.mock("@/lib/queries/use-work-order-detail", () => ({
  useUpdateWorkOrderStatus: mocks.useUpdateWorkOrderStatus,
}));

vi.mock("@/lib/hooks/use-realtime-multi", () => ({
  useRealtimeMulti: () => null,
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => "all",
}));

vi.mock("@/lib/hooks/use-table-filters", () => ({
  useTableFilters: () => ({
    search: filterState.search,
    setSearch: mocks.setSearch,
    status: filterState.status,
    setStatus: mocks.setStatus,
    page: 1,
    setPage: vi.fn(),
    sort: "",
    setSort: vi.fn(),
    dateFrom: "",
    setDateFrom: vi.fn(),
    dateTo: "",
    setDateTo: vi.fn(),
    view: "table",
    setView: vi.fn(),
    category: "",
    setCategory: vi.fn(),
    resetAll: vi.fn(),
    activeCount: 0,
  }),
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-01-15T10:00:00.000Z"),
}));

vi.mock("@/hooks/use-is-first-load", () => ({
  useIsFirstLoad: mocks.useIsFirstLoad,
}));

vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({
    setDetailWorkOrderId: mocks.setDetailWorkOrderId,
    setNewWorkOrderSheetOpen: mocks.setNewWorkOrderSheetOpen,
  }),
}));

vi.mock("@/components/work-orders/change-status-drawer", () => ({
  ChangeStatusDrawer: ({
    open,
    onOpenChange,
    workOrderId,
    currentStatus,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workOrderId: string;
    currentStatus: string;
  }) => (
    <div
      data-testid="change-status-drawer"
      data-open={String(open)}
      data-wo={workOrderId}
      data-status={currentStatus}
    >
      <button type="button" onClick={() => onOpenChange(false)}>
        close-drawer
      </button>
    </div>
  ),
}));

// ── Fixtures ────────────────────────────────────────────────────────
const wo1: WorkOrderListItem = {
  id: "wo-1234abcd",
  status: "New",
  created_at: "2026-01-10T08:00:00.000Z",
  mechanic_id: "m-1",
  mechanic: { id: "m-1", full_name: "Bat Mechanic", avatar_url: null },
  customer: { first_name: "Saraa", last_name: "Bat" },
  vehicle: {
    plate_number: "7891УБА",
    make: "Toyota",
    model: "Prius",
  },
  grand_total: 1250000,
  services_cost: 800000,
  parts_cost: 450000,
  gross_profit: 300000,
  margin_percent: 24,
  loss_reason: null,
};

const wo2: WorkOrderListItem = {
  id: "wo-5678efgh",
  status: "Completed",
  created_at: "2026-01-15T08:00:00.000Z",
  mechanic_id: null,
  mechanic: null,
  customer: null,
  vehicle: null,
  grand_total: undefined,
  services_cost: undefined,
  parts_cost: undefined,
  gross_profit: undefined,
  margin_percent: undefined,
  loss_reason: null,
};

function ordersResult(overrides: Record<string, unknown> = {}) {
  return {
    data: [wo1, wo2],
    isPending: false,
    isFetching: false,
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────
function renderPage() {
  const view = render(<WorkOrdersPage />);
  const user = userEvent.setup();
  return { user, ...view };
}

beforeEach(() => {
  vi.clearAllMocks();
  filterState.search = "";
  filterState.status = "";
  mocks.useCurrentOrg.mockReturnValue({ data: { orgId: "org-1" } });
  mocks.useOrgMutation.mockReturnValue({
    mutate: mocks.mutate,
    isPending: false,
  });
  mocks.useUpdateWorkOrderStatus.mockReturnValue({
    mutate: mocks.updateStatusMutate,
    isPending: false,
  });
  mocks.useWorkOrders.mockReturnValue(ordersResult());
  mocks.useIsFirstLoad.mockReturnValue(false);
  mocks.setSearch.mockImplementation((value: string) => {
    filterState.search = value;
  });
  mocks.setStatus.mockImplementation((value: string) => {
    filterState.status = value;
  });
});

// ── Tests ───────────────────────────────────────────────────────────
describe("WorkOrdersPage", () => {
  it("renders the page title, description and new work order button", () => {
    renderPage();

    expect(screen.getByText("workOrders.title")).toBeInTheDocument();
    expect(screen.getByText("workOrders.subtitle")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "workOrders.newWorkOrder" }),
    ).toBeInTheDocument();
  });

  it("shows a loading skeleton on first load and hides the new work order button", () => {
    mocks.useIsFirstLoad.mockReturnValue(true);
    mocks.useWorkOrders.mockReturnValue(
      ordersResult({ data: undefined, isPending: true, isFetching: true }),
    );

    renderPage();

    expect(
      screen.queryByRole("button", { name: "workOrders.newWorkOrder" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("workOrders.title")).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("renders the error message and retries on button click", async () => {
    mocks.useWorkOrders.mockReturnValue(
      ordersResult({
        data: undefined,
        error: new Error("Failed to load work orders"),
      }),
    );

    const { user } = renderPage();

    expect(screen.getByText("Failed to load work orders")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "tryAgain" }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state and opens the new work order sheet", async () => {
    mocks.useWorkOrders.mockReturnValue(ordersResult({ data: [] }));

    const { user } = renderPage();

    expect(screen.getByText("workOrders.noWorkOrders")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "workOrders.createFirst" }),
    );
    expect(mocks.setNewWorkOrderSheetOpen).toHaveBeenCalledWith(true);
  });

  it("renders work order rows with customer, vehicle, mechanic, status, age and totals", () => {
    renderPage();

    const table = screen.getByRole("table");
    expect(within(table).getByText("Saraa Bat")).toBeInTheDocument();
    expect(within(table).getByText("7891УБА")).toBeInTheDocument();
    expect(within(table).getByText("Toyota Prius")).toBeInTheDocument();
    expect(within(table).getByText("Bat Mechanic")).toBeInTheDocument();
    expect(
      within(table).getByRole("button", { name: "New" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("button", { name: "Completed" }),
    ).toBeInTheDocument();
    expect(within(table).getByText("daysAgo")).toBeInTheDocument();
    expect(within(table).getByText("today")).toBeInTheDocument();
    expect(within(table).getByText("₮ 1,250,000")).toBeInTheDocument();
    // Row without customer/vehicle/mechanic/totals falls back to em dashes
    expect(within(table).getAllByText("—").length).toBeGreaterThanOrEqual(4);
    // Pagination summary renders for the single page of 20
    expect(screen.getByText("pageOf")).toBeInTheDocument();
  });

  it("renders mobile cards alongside the table with plate, status and formatted totals", () => {
    renderPage();

    // Desktop table + mobile card each render the plate, total and status
    expect(screen.getAllByText("7891УБА")).toHaveLength(2);
    expect(screen.getAllByText("₮ 1,250,000")).toHaveLength(2);
    expect(screen.getAllByText("New")).toHaveLength(2);
  });

  it("hides the id and loss reason columns by default", () => {
    renderPage();

    expect(screen.queryByText("#wo-1234")).not.toBeInTheDocument();
    expect(screen.queryByText("#wo-5678")).not.toBeInTheDocument();
    expect(screen.queryByText("lossReason")).not.toBeInTheDocument();
  });

  it("shows per-status counts and refetches with the selected status filter", async () => {
    const { user, rerender } = renderPage();

    expect(
      screen.getByRole("button", { name: "workOrders.statusNew" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "workOrders.statusCompleted" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "workOrders.statusCompleted" }),
    );
    await waitFor(() =>
      expect(mocks.setStatus).toHaveBeenCalledWith("Completed"),
    );

    rerender(<WorkOrdersPage />);
    expect(mocks.useWorkOrders).toHaveBeenLastCalledWith(
      "org-1",
      "Completed",
      "",
      null,
    );
  });

  it("searches by typing and pressing Enter, then refetches with the query", async () => {
    const { user, rerender } = renderPage();

    const input = screen.getByPlaceholderText("workOrders.searchPlaceholder");
    await user.type(input, "plates");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(mocks.setSearch).toHaveBeenCalledWith("plates"));

    rerender(<WorkOrdersPage />);
    expect(mocks.useWorkOrders).toHaveBeenLastCalledWith(
      "org-1",
      "",
      "plates",
      null,
    );
  });

  it("opens the change-status drawer with the row id and current status", async () => {
    const { user } = renderPage();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    await user.click(within(rows[1]).getByRole("button", { name: "New" }));

    const drawer = screen.getByTestId("change-status-drawer");
    expect(drawer).toHaveAttribute("data-open", "true");
    expect(drawer).toHaveAttribute("data-wo", wo1.id);
    expect(drawer).toHaveAttribute("data-status", "New");

    await user.click(screen.getByRole("button", { name: "close-drawer" }));
    await waitFor(() =>
      expect(screen.getByTestId("change-status-drawer")).toHaveAttribute(
        "data-open",
        "false",
      ),
    );
  });

  it("opens the work order detail when a row is clicked", async () => {
    const { user } = renderPage();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    await user.click(within(rows[1]).getByText("Saraa Bat"));

    expect(mocks.setDetailWorkOrderId).toHaveBeenCalledWith(wo1.id);
  });

  it("opens the detail page from the row actions menu", async () => {
    const { user } = renderPage();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    await user.click(within(rows[1]).getByRole("button", { name: "" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "viewDetails" }),
    );

    expect(mocks.setDetailWorkOrderId).toHaveBeenCalledWith(wo1.id);
  });

  it("cancels a work order through the row menu and confirm dialog", async () => {
    const { user } = renderPage();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    await user.click(within(rows[1]).getByRole("button", { name: "" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "cancelWorkOrder" }),
    );

    await user.click(
      await screen.findByRole("button", { name: "workOrders.confirmCancel" }),
    );
    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith({ id: wo1.id }),
    );
  });
});
