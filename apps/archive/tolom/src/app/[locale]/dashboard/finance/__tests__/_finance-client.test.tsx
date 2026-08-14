import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { DateRange } from "react-day-picker";
import { describe, expect, it, vi } from "vitest";
import type { DashboardData } from "@/lib/types";
import { render } from "@/test/test-utils";
import FinancePage from "../_finance-client";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// Render dynamically-imported tab modules from their (mocked) modules.
// The real importers resolve to `{ default: Component }`.
vi.mock("next/dynamic", () => ({
  default: (importFn: () => Promise<Record<string, unknown>>) => {
    const DynamicComponent = (props: Record<string, unknown>) => {
      const [Comp, setComp] = React.useState<React.ComponentType | null>(null);
      React.useEffect(() => {
        let mounted = true;
        importFn().then((resolved) => {
          if (!mounted) return;
          const component =
            typeof resolved === "function"
              ? resolved
              : Object.values(resolved)[0];
          setComp(() => component as React.ComponentType);
        });
        return () => {
          mounted = false;
        };
      }, []);
      if (!Comp) return null;
      return <Comp {...props} />;
    };
    return DynamicComponent;
  },
}));

// ── Hook mocks ───────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  useDashboard: vi.fn(),
  useBranches: vi.fn(),
  useOrgSettings: vi.fn(),
  useCurrentOrg: vi.fn(),
  setSelectedBranchId: vi.fn(),
}));

// Mini zustand: a store the mocked hook subscribes to, so the setter
// triggers real re-renders (mirrors useSelectedBranchId's behavior).
const branchStore = vi.hoisted(() => {
  const s: {
    selectedBranchId: string;
    listeners: Set<() => void>;
    set: (id: string) => void;
  } = {
    selectedBranchId: "all",
    listeners: new Set<() => void>(),
    set: () => {},
  };
  s.set = (id: string) => {
    s.selectedBranchId = id;
    s.listeners.forEach((listener) => listener());
  };
  return s;
});

vi.mock("@/lib/queries/use-dashboard", () => ({
  useDashboard: mocks.useDashboard,
}));
vi.mock("@/lib/queries/use-branches", () => ({
  useBranches: mocks.useBranches,
}));
vi.mock("@/lib/queries/use-org-settings", () => ({
  useOrgSettings: mocks.useOrgSettings,
}));
vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));
vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () =>
    React.useSyncExternalStore(
      (onChange: () => void) => {
        branchStore.listeners.add(onChange);
        return () => branchStore.listeners.delete(onChange);
      },
      () => branchStore.selectedBranchId,
    ),
  // Hook-shaped: useSetSelectedBranchId() returns the setter, which records
  // the call and updates the store so subscribed components re-render.
  useSetSelectedBranchId: () => (id: string) => {
    mocks.setSelectedBranchId(id);
    branchStore.set(id);
  },
}));

// ── Tab stubs (children are covered by their own test files) ─────
vi.mock("../_overview-tab", () => ({
  OverviewTab: ({
    hasAnyData,
    hasRevenue,
    summary,
    insightLine,
    loading,
  }: {
    hasAnyData: boolean;
    hasRevenue: boolean;
    summary: { totalRevenue?: number } | null;
    insightLine: string | null;
    loading: boolean;
  }) => (
    <div
      data-testid="tab-overview"
      data-has-any-data={String(hasAnyData)}
      data-has-revenue={String(hasRevenue)}
      data-loading={String(loading)}
      data-summary-revenue={String(summary?.totalRevenue ?? "")}
      data-insight={insightLine ?? ""}
    />
  ),
}));

vi.mock("../_transactions-tab", () => ({
  TransactionsTab: ({
    filteredWorkOrders,
  }: {
    filteredWorkOrders: unknown[];
  }) => (
    <div
      data-testid="tab-transactions"
      data-count={filteredWorkOrders.length}
    />
  ),
}));

vi.mock("../_invoices-tab", () => ({
  InvoicesTab: ({ orgId }: { orgId: string | null }) => (
    <div data-testid="tab-invoices" data-orgid={orgId ?? "null"} />
  ),
}));

vi.mock("../_refunds-tab", () => ({
  RefundsTab: ({ orgId }: { orgId: string }) => (
    <div data-testid="tab-refunds" data-orgid={orgId} />
  ),
}));

vi.mock("../_expenses-tab", () => ({
  ExpensesTab: ({ orgId }: { orgId: string | null }) => (
    <div data-testid="tab-expenses" data-orgid={orgId ?? "null"} />
  ),
}));

// ── Heavy child stubs (branch filter + date range are not the focus) ──
vi.mock("@/components/branch-select", () => ({
  BranchSelect: (props: {
    value: string;
    onChange: (v: string) => void;
    branches: { id: string; name: string }[];
    placeholder: string;
    allLabel: string;
  }) => {
    const { value, onChange, branches, placeholder, allLabel } = props;
    return (
      <div data-testid="branch-select" role="listbox" aria-label={placeholder}>
        <button
          type="button"
          role="option"
          aria-selected={value === "all"}
          onClick={() => onChange("all")}
        >
          {allLabel}
        </button>
        {branches.map((b) => (
          <button
            key={b.id}
            type="button"
            role="option"
            aria-selected={value === b.id}
            onClick={() => onChange(b.id)}
          >
            {b.name}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock("@/components/ui/date-range-picker", () => ({
  DateRangePicker: ({
    onChange,
  }: {
    onChange?: (range?: DateRange) => void;
  }) => (
    <div data-testid="date-range-picker">
      <button
        type="button"
        onClick={() => onChange?.({ from: undefined, to: undefined })}
      >
        clear-range
      </button>
    </div>
  ),
}));

// ── Fixtures ─────────────────────────────────────────────────────
const branches = [
  { id: "b1", name: "Main" },
  { id: "b2", name: "West" },
];

const summary: DashboardData["summary"] = {
  totalRevenue: 500000,
  activeWorkOrders: 12,
  completedToday: 5,
  newCustomersToday: 3,
  avgRepairOrderValue: 150000,
  partsRevenue: 200000,
  serviceRevenue: 300000,
  grossProfit: 250000,
  marginPercent: 50,
  totalCustomers: 85,
  totalVehicles: 120,
};

const dashboardData: DashboardData = {
  summary,
  summaryComparison: null,
  insights: [],
  workOrderStatusDistribution: [],
  revenueTrend: [],
  topServices: [],
  technicianPerformance: [],
  recentWorkOrders: [
    { id: "WO-1", status: "In Progress", vehicle: { plate_number: "1234УБА" } },
    { id: "WO-2", status: "Completed", vehicle: { plate_number: "5678УБА" } },
  ] as unknown as DashboardData["recentWorkOrders"],
  serviceCategoryBreakdown: [],
  customerAcquisitionTrend: [],
};

function setOrg(overrides: Record<string, unknown> = {}) {
  mocks.useCurrentOrg.mockReturnValue({
    data: { orgId: "org-1" },
    isPending: false,
    error: null,
    ...overrides,
  });
}

function setDashboard(overrides: Record<string, unknown> = {}) {
  mocks.useDashboard.mockReturnValue({
    data: dashboardData,
    isPending: false,
    error: null,
    ...overrides,
  });
}

describe("FinancePage", () => {
  beforeEach(() => {
    setOrg();
    setDashboard();
    mocks.useBranches.mockReturnValue({ data: branches });
    mocks.useOrgSettings.mockReturnValue({
      settings: {},
      isLoading: false,
      error: null,
    });
    branchStore.selectedBranchId = "all";
    branchStore.listeners.clear();
    mocks.setSelectedBranchId.mockReset();
  });

  it("renders the header, subtitle and all five finance tabs", async () => {
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    expect(screen.getByText("nav.finance")).toBeTruthy();
    expect(screen.getByText("finance.subtitle")).toBeTruthy();
    for (const tab of [
      "tabOverview",
      "tabTransactions",
      "tabInvoices",
      "tabExpenses",
      "tabRefunds",
    ]) {
      expect(screen.getByRole("tab", { name: tab })).toBeTruthy();
    }
  });

  it("passes the loading state to the overview tab while dashboard data is pending", async () => {
    setDashboard({ data: undefined, isPending: true });
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    const overview = screen.getByTestId("tab-overview");
    expect(overview.getAttribute("data-loading")).toBe("true");
    expect(overview.getAttribute("data-has-any-data")).toBe("false");
  });

  it("renders dashboard summary stats and the insight line into the overview tab", async () => {
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    const overview = screen.getByTestId("tab-overview");
    expect(overview.getAttribute("data-loading")).toBe("false");
    expect(overview.getAttribute("data-has-revenue")).toBe("true");
    expect(overview.getAttribute("data-has-any-data")).toBe("true");
    expect(overview.getAttribute("data-summary-revenue")).toBe("500000");
    const insight = overview.getAttribute("data-insight") ?? "";
    expect(insight).toContain("₮ 500,000");
    expect(insight).toContain("50.0%");
  });

  it("renders the error card with a retry button when the dashboard query fails", async () => {
    setDashboard({ data: undefined, error: new Error("boom") });
    render(<FinancePage />);
    await waitFor(() => expect(screen.getByText("boom")).toBeTruthy());
    expect(screen.getByRole("button", { name: "finance.retry" })).toBeTruthy();
    expect(screen.queryByTestId("tab-overview")).toBeNull();
  });

  it("shows the failed-to-load-org error when the org query fails", async () => {
    setOrg({ error: new Error("org down") });
    setDashboard({ data: undefined });
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByText("finance.failedToLoadOrg")).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "finance.retry" })).toBeTruthy();
  });

  it("shows the no-org-found error when no organization is available", async () => {
    setOrg({ data: null, isPending: false, error: null });
    setDashboard({ data: undefined });
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByText("finance.noOrgFound")).toBeTruthy(),
    );
  });

  it("keeps rendering content when an error exists alongside data", async () => {
    setDashboard({ error: new Error("stale") });
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    expect(screen.queryByText("stale")).toBeNull();
    expect(
      screen.getByTestId("tab-overview").getAttribute("data-has-any-data"),
    ).toBe("true");
  });

  it("shows the branch selector when finance is separated per branch and changing it re-queries with the branch", async () => {
    mocks.useOrgSettings.mockReturnValue({
      settings: { finance_separate_per_branch: true },
      isLoading: false,
      error: null,
    });
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    const branchSelect = screen.getByTestId("branch-select");
    expect(branchSelect).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "dashboard.allBranches" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Main" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "West" })).toBeTruthy();

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole("option", { name: "West" }));
    });

    expect(mocks.setSelectedBranchId).toHaveBeenCalledWith("b2");
    expect(mocks.useDashboard).toHaveBeenLastCalledWith(
      "org-1",
      expect.objectContaining({ branchId: "b2" }),
    );
  });

  it("hides the branch selector when finance is not separated per branch or only one branch exists", async () => {
    const { rerender } = render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    expect(screen.queryByTestId("branch-select")).toBeNull();

    mocks.useOrgSettings.mockReturnValue({
      settings: { finance_separate_per_branch: true },
      isLoading: false,
      error: null,
    });
    mocks.useBranches.mockReturnValue({ data: [branches[0]] });
    rerender(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    expect(screen.queryByTestId("branch-select")).toBeNull();
  });

  it("switches tabs and passes the org id to the invoices, refunds and expenses panels", async () => {
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("tab", { name: "tabInvoices" }));
    await waitFor(() =>
      expect(screen.getByTestId("tab-invoices")).toBeTruthy(),
    );
    expect(screen.getByTestId("tab-invoices").getAttribute("data-orgid")).toBe(
      "org-1",
    );
    expect(
      document
        .getElementById("finance-panel-invoices")
        ?.getAttribute("aria-labelledby"),
    ).toBe("finance-tab-invoices");

    fireEvent.click(screen.getByRole("tab", { name: "tabRefunds" }));
    await waitFor(() => expect(screen.getByTestId("tab-refunds")).toBeTruthy());
    expect(screen.getByTestId("tab-refunds").getAttribute("data-orgid")).toBe(
      "org-1",
    );

    fireEvent.click(screen.getByRole("tab", { name: "tabExpenses" }));
    await waitFor(() =>
      expect(screen.getByTestId("tab-expenses")).toBeTruthy(),
    );
    expect(screen.getByTestId("tab-expenses").getAttribute("data-orgid")).toBe(
      "org-1",
    );
  });

  it("passes the filtered work orders to the transactions tab", async () => {
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("tab", { name: "tabTransactions" }));
    await waitFor(() =>
      expect(screen.getByTestId("tab-transactions")).toBeTruthy(),
    );
    expect(
      screen.getByTestId("tab-transactions").getAttribute("data-count"),
    ).toBe("2");
  });

  it("shows the large-dataset alert when the date range is cleared", async () => {
    render(<FinancePage />);
    await waitFor(() =>
      expect(screen.getByTestId("tab-overview")).toBeTruthy(),
    );
    expect(screen.queryByText("finance.largeDataset")).toBeNull();

    fireEvent.click(screen.getByText("clear-range"));

    await waitFor(() =>
      expect(screen.getByText("finance.largeDataset")).toBeTruthy(),
    );
    expect(screen.getByText("finance.largeDatasetDesc")).toBeTruthy();
  });
});
