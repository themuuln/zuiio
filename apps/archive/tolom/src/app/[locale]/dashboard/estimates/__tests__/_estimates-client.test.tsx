import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as NextIntl from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstimateListItem } from "@/lib/queries/use-estimates";
import { render } from "@/test/test-utils";
import { EstimatesPage } from "../_estimates-client";

// ── Mutable mock state (hoisted so mock factories can reference it) ──
const mocks = vi.hoisted(() => ({
  useEstimates: vi.fn(),
  useRealtimeMulti: vi.fn(),
  useIsFirstLoad: vi.fn(),
  push: vi.fn(),
  refetch: vi.fn(),
  setSearch: vi.fn(),
  setStatus: vi.fn(),
  currentOrg: { orgId: "org-1" } as { orgId: string } | undefined,
  selectedBranchId: "all",
}));

const filters = vi.hoisted(() => ({ search: "", status: "all" }));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/queries/use-estimates", () => ({
  useEstimates: mocks.useEstimates,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: mocks.currentOrg }),
}));

vi.mock("@/lib/hooks/use-realtime-multi", () => ({
  useRealtimeMulti: mocks.useRealtimeMulti,
}));

vi.mock("@/hooks/use-is-first-load", () => ({
  useIsFirstLoad: mocks.useIsFirstLoad,
}));

vi.mock("@/lib/hooks/use-table-filters", () => ({
  useTableFilters: () => ({
    search: filters.search,
    setSearch: (value: string) => {
      filters.search = value;
      mocks.setSearch(value);
    },
    status: filters.status,
    setStatus: (value: string) => {
      filters.status = value;
      mocks.setStatus(value);
    },
    page: 1,
    setPage: vi.fn(),
    sort: "",
    setSort: vi.fn(),
    dateFrom: null,
    setDateFrom: vi.fn(),
    dateTo: null,
    setDateTo: vi.fn(),
    view: "table",
    setView: vi.fn(),
    category: "",
    setCategory: vi.fn(),
    resetAll: vi.fn(),
    activeCount: 0,
  }),
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => mocks.selectedBranchId,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("../_new-estimate-drawer", () => ({
  NewEstimateDrawer: ({ open }: { open: boolean }) => (
    <div
      data-testid="new-estimate-drawer"
      data-open={open ? "true" : "false"}
    />
  ),
}));

// ── Fixtures ─────────────────────────────────────────────────────

function makeEstimates(): EstimateListItem[] {
  return [
    {
      id: "est-1",
      estimate_number: "EST-0001",
      status: "sent",
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      grand_total: 150000,
      created_at: "2026-07-01T09:00:00.000Z",
      valid_until: null,
      customer: { first_name: "Bat", last_name: "Erdene", phone: null },
      vehicle: {
        plate_number: "1234УБА",
        make: "Toyota",
        model: "Prius",
      },
      items: [{ id: "i1" }, { id: "i2" }],
      converted_work_order: null,
      appointment: null,
    },
    {
      id: "est-2",
      estimate_number: "EST-0002",
      status: "approved",
      customer_id: null,
      vehicle_id: null,
      grand_total: 80000,
      created_at: "2026-07-02T10:00:00.000Z",
      valid_until: null,
      customer: null,
      vehicle: null,
      items: [{ id: "i3" }],
      converted_work_order: { id: "wo-9", status: "open", total: 80000 },
      appointment: null,
    },
    {
      id: "est-3",
      estimate_number: "EST-0003",
      status: "declined",
      customer_id: "cust-2",
      vehicle_id: "veh-2",
      grand_total: 0,
      created_at: "2026-07-03T11:00:00.000Z",
      valid_until: null,
      customer: { first_name: "Saraa", last_name: null, phone: null },
      vehicle: { plate_number: "7777УБА", make: "Honda", model: null },
      items: [],
      converted_work_order: null,
      appointment: null,
    },
  ];
}

function estimatesResult(overrides: Record<string, unknown> = {}) {
  return {
    data: makeEstimates(),
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  };
}

function estimateCard(name: string | RegExp) {
  return screen.getByRole("button", { name });
}

function drawerOpen() {
  return screen.getByTestId("new-estimate-drawer").getAttribute("data-open");
}

describe("EstimatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filters.search = "";
    filters.status = "all";
    mocks.currentOrg = { orgId: "org-1" };
    mocks.selectedBranchId = "all";
    mocks.useEstimates.mockReturnValue(estimatesResult());
    mocks.useIsFirstLoad.mockReturnValue(false);
  });

  it("renders skeletons while loading the first page", () => {
    mocks.useIsFirstLoad.mockReturnValue(true);
    mocks.useEstimates.mockReturnValue(
      estimatesResult({ data: undefined, isPending: true, isFetching: true }),
    );

    render(<EstimatesPage />);

    // Header action is replaced by a skeleton, not the New Estimate button
    expect(screen.queryByRole("button", { name: "newQuote" })).toBeNull();
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    // KPI cards render zeros while pending
    expect(screen.getAllByRole("heading", { level: 3 })[0].textContent).toBe(
      "0",
    );
    expect(screen.queryByText("EST-0001")).toBeNull();
  });

  it("renders each estimate with number, status, customer, vehicle, items and total", () => {
    render(<EstimatesPage />);

    const card = estimateCard(/EST-0001/);
    within(card).getByText("EST-0001");
    within(card).getByText("status_sent");
    within(card).getByText("Bat Erdene");
    within(card).getByText("1234УБА · Toyota · Prius");
    within(card).getByText("2");
    within(card).getByText("₮ 150,000");
    within(card).getByText(/^created /);

    // All three estimates render as rows
    expect(estimateCard(/EST-0002/)).toBeTruthy();
    expect(estimateCard(/EST-0003/)).toBeTruthy();
  });

  it("shows the converted-to-work-order badge and dash fallbacks for missing customer/vehicle", () => {
    render(<EstimatesPage />);

    const converted = estimateCard(/EST-0002/);
    within(converted).getByText("convertedToWorkOrder");
    // customer and vehicle are both null -> two fallback dashes
    expect(within(converted).getAllByText("—")).toHaveLength(2);

    const plain = estimateCard(/EST-0001/);
    expect(within(plain).queryByText("convertedToWorkOrder")).toBeNull();
  });

  it("renders KPI summary cards and the approved stats badge", () => {
    render(<EstimatesPage />);

    // allStatuses, active, status_sent, grandTotal — in document order
    const values = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(values).toEqual(["3", "2", "1", "₮ 230,000"]);

    expect(screen.getByText("1 status_approved")).toBeTruthy();
  });

  it("renders status filter chips with counts and re-queries on status click", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EstimatesPage />);

    // All + 6 status chips
    expect(screen.getByRole("button", { name: /^all/ })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^status_/ })).toHaveLength(6);

    await user.click(screen.getByRole("button", { name: /^status_sent/ }));
    expect(mocks.setStatus).toHaveBeenCalledWith("sent");

    rerender(<EstimatesPage />);
    expect(mocks.useEstimates).toHaveBeenLastCalledWith(
      "org-1",
      "sent",
      "",
      null,
    );
  });

  it("re-queries with the search term when the search input changes", () => {
    const { rerender } = render(<EstimatesPage />);

    fireEvent.change(screen.getByPlaceholderText("search"), {
      target: { value: "abc" },
    });
    expect(mocks.setSearch).toHaveBeenCalledWith("abc");

    rerender(<EstimatesPage />);
    expect(mocks.useEstimates).toHaveBeenLastCalledWith(
      "org-1",
      undefined,
      "abc",
      null,
    );
  });

  it("renders the empty state and opens the drawer from the empty-state button", async () => {
    const user = userEvent.setup();
    mocks.useEstimates.mockReturnValue(estimatesResult({ data: [] }));
    render(<EstimatesPage />);

    expect(screen.getByText("noQuotes")).toBeTruthy();
    expect(screen.getByText("noQuotesDesc")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "createQuote" }));
    await waitFor(() => expect(drawerOpen()).toBe("true"));
  });

  it("shows the error banner with the message and retries via refetch", async () => {
    const user = userEvent.setup();
    mocks.useEstimates.mockReturnValue(
      estimatesResult({
        data: undefined,
        error: new Error("boom"),
      }),
    );
    render(<EstimatesPage />);

    expect(screen.getByText("somethingWentWrong")).toBeTruthy();
    expect(screen.getByText("boom")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "tryAgain" }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it("navigates to the estimate detail page when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<EstimatesPage />);

    await user.click(estimateCard(/EST-0001/));
    expect(mocks.push).toHaveBeenCalledWith("/dashboard/estimates/est-1");
  });

  it("opens the New Estimate drawer from the header button", async () => {
    const user = userEvent.setup();
    render(<EstimatesPage />);

    expect(drawerOpen()).toBe("false");
    await user.click(screen.getByRole("button", { name: "newQuote" }));
    await waitFor(() => expect(drawerOpen()).toBe("true"));
  });

  it("subscribes to estimate tables via realtime and disables it without an org", () => {
    render(<EstimatesPage />);

    expect(mocks.useRealtimeMulti).toHaveBeenCalledTimes(1);
    const call = mocks.useRealtimeMulti.mock.calls[0][0] as unknown as {
      enabled: boolean;
      tables: Array<{ table: string }>;
    };
    expect(call.enabled).toBe(true);
    expect(call.tables.map((entry) => entry.table)).toEqual([
      "estimates",
      "estimate_items",
    ]);

    mocks.currentOrg = undefined;
    render(<EstimatesPage />);
    expect(mocks.useRealtimeMulti).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("passes the selected branch to the estimates query and shows the branch badge", () => {
    mocks.selectedBranchId = "branch-1";
    render(<EstimatesPage />);

    expect(screen.getByText("branch")).toBeTruthy();
    expect(mocks.useEstimates).toHaveBeenLastCalledWith(
      "org-1",
      undefined,
      "",
      "branch-1",
    );
  });
});
