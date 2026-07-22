import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render } from "@/test/test-utils";
import ReportsPage from "./page";

// ── Mock data hooks ──────────────────────────────────────────
vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1" },
    isPending: false,
    error: null,
  }),
}));
vi.mock("@/lib/queries/use-branches", () => ({
  useBranches: () => ({ data: [] }),
}));

const mockReport = vi.fn();
vi.mock("@/lib/queries/use-reports", () => ({
  useReport: (...args: unknown[]) => mockReport(...args),
  useMechanics: () => ({ data: [] }),
  useReportInsights: () => ({ data: [] }),
  useReportForecast: () => ({ data: null }),
  useReportTargets: () => ({ data: [] }),
  useReportRetention: () => ({ data: null }),
  useReportPnl: () => ({ data: null }),
  useReportServiceBreakdown: () => ({ data: [] }),
  useReportFinanceSummary: () => ({ data: null, isPending: false }),
}));

vi.mock("@/hooks/use-selected-branch-guard", () => ({
  useSelectedBranchGuard: () => {},
}));
vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => "all",
  useSetSelectedBranchId: () => vi.fn(),
}));

// ── Mock dynamic tab imports ─────────────────────────────────
vi.mock("./_eod-view", () => ({
  EodView: ({ data }: { data: Record<string, unknown> }) => (
    <div
      data-testid="eod-view"
      data-mechanics={String(data?.mechanics?.length ?? 0)}
    >
      EodView
    </div>
  ),
}));
vi.mock("./_finance-tab", () => ({
  FinanceTab: () => <div data-testid="finance-tab">FinanceTab</div>,
}));
vi.mock("./_overview-tab", () => ({
  OverviewTab: ({ reportType }: { reportType: string }) => (
    <div data-testid="overview-tab" data-type={reportType}>
      OverviewTab
    </div>
  ),
}));

// ── Mock child components ────────────────────────────────────
// ReportsTabBar renders clickable buttons so tab switching can
// be exercised in tests.
vi.mock("./_reports-header", () => ({
  ReportsHeader: () => <div data-testid="reports-header">Header</div>,
}));
vi.mock("./_reports-tab-bar", () => ({
  ReportsTabBar: ({
    onTabChange,
    tabs,
  }: {
    onTabChange?: (value: string) => void;
    tabs: Array<{ label: string; value: string }>;
  }) => (
    <div data-testid="reports-tab-bar">
      {tabs.map((t: { label: string; value: string }) => (
        <button
          key={t.value}
          data-testid={`tab-${t.value}`}
          onClick={() => onTabChange?.(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("./_reports-filters", () => ({
  ReportsFilters: () => <div data-testid="reports-filters">Filters</div>,
}));
vi.mock("./_reports-date-picker", () => ({
  ReportsDatePicker: () => (
    <div data-testid="reports-date-picker">DatePicker</div>
  ),
}));
vi.mock("./_reports-skeleton", () => ({
  ReportsSkeleton: () => <div data-testid="reports-skeleton">Skeleton</div>,
}));

// ── Messages for next-intl ───────────────────────────────────
const messages = {
  reports: {
    title: "Reports",
    subtitle: "View your business performance",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    customRange: "Custom Range",
    eodSummary: "EOD Summary",
    mechanic: "Mechanic",
    jobs: "Jobs",
    services: "Services",
    parts: "Parts",
    revenue: "Revenue",
    avgPerWo: "Avg/WO",
    errorLoading: "Error loading reports",
    eodSheet: "EOD",
    total: "Total",
  },
};

// ── Test data ────────────────────────────────────────────────
const reportData = {
  date: "2024-01-15",
  total_revenue: 100000,
  total_work_orders: 5,
  total_discounts: 0,
  total_commission: 0,
  comparison: null,
  profitability: null,
  mechanic_kpis: [],
  mechanics: [],
};

const eodReportData = {
  date: "2024-01-15",
  mechanics: [
    {
      mechanic_id: "m1",
      mechanic_name: "John",
      work_orders_completed: 3,
      services_performed: 5,
      parts_used: 8,
      total_revenue: 50000,
    },
  ],
  total_work_orders: 3,
  total_revenue: 50000,
};

// ── Tests ────────────────────────────────────────────────────
describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReport.mockReturnValue({
      data: null,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("renders loading skeleton when data is pending", () => {
    mockReport.mockReturnValue({
      data: null,
      isPending: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<ReportsPage />, { messages });

    expect(screen.getByTestId("reports-skeleton")).toBeInTheDocument();
    // Data-dependent content is hidden during loading
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("eod-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("finance-tab")).not.toBeInTheDocument();
    // Layout components still render during loading
    expect(screen.getByTestId("reports-header")).toBeInTheDocument();
    expect(screen.getByTestId("reports-tab-bar")).toBeInTheDocument();
    expect(screen.getByTestId("reports-filters")).toBeInTheDocument();
    expect(screen.getByTestId("reports-date-picker")).toBeInTheDocument();
  });

  it("renders error card when report query fails", () => {
    mockReport.mockReturnValue({
      data: null,
      isPending: false,
      isError: true,
      error: new Error("API failure"),
      refetch: vi.fn(),
    });
    render(<ReportsPage />, { messages });

    expect(screen.getByText("Error loading reports")).toBeInTheDocument();
    expect(screen.queryByTestId("reports-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("eod-view")).not.toBeInTheDocument();
    expect(
      screen.queryByText("View your business performance"),
    ).not.toBeInTheDocument();
  });

  it("renders empty state card when no data and no error", () => {
    mockReport.mockReturnValue({
      data: null,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<ReportsPage />, { messages });

    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(
      screen.getByText("View your business performance"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("reports-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("eod-view")).not.toBeInTheDocument();
  });

  it("renders OverviewTab with daily report type by default", async () => {
    mockReport.mockReturnValue({
      data: reportData,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<ReportsPage />, { messages });

    await waitFor(() => {
      const overviewTab = screen.getByTestId("overview-tab");
      expect(overviewTab).toHaveAttribute("data-type", "daily");
    });
    expect(screen.queryByTestId("reports-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("eod-view")).not.toBeInTheDocument();
  });

  it("switches to EOD view when EOD tab is clicked", async () => {
    const user = userEvent.setup();
    mockReport.mockReturnValue({
      data: eodReportData,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<ReportsPage />, { messages });

    await user.click(screen.getByTestId("tab-eod"));

    await waitFor(() => {
      expect(screen.getByTestId("eod-view")).toBeInTheDocument();
    });
    const eodView = screen.getByTestId("eod-view");
    expect(eodView).toHaveAttribute("data-mechanics", "1");
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
  });

  it("switches to Finance tab when Finance tab is clicked", async () => {
    const user = userEvent.setup();
    mockReport.mockReturnValue({
      data: reportData,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<ReportsPage />, { messages });

    await user.click(screen.getByTestId("tab-finance"));

    await waitFor(() => {
      expect(screen.getByTestId("finance-tab")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
  });

  it("renders layout chrome in all non-loading states", () => {
    mockReport.mockReturnValue({
      data: reportData,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<ReportsPage />, { messages });

    expect(screen.getByTestId("reports-header")).toBeInTheDocument();
    expect(screen.getByTestId("reports-tab-bar")).toBeInTheDocument();
    expect(screen.getByTestId("reports-filters")).toBeInTheDocument();
    expect(screen.getByTestId("reports-date-picker")).toBeInTheDocument();
  });
});
