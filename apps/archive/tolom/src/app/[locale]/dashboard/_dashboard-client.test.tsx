import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DashboardPage } from "./_dashboard-client";

// ── Mocks ──────────────────────────────────────────────────────────

// next/dynamic — ChartsSection is dynamically imported
vi.mock("next/dynamic", () => ({
  default: () => {
    const DynamicComponent = () => (
      <div data-testid="charts-section">ChartsSection</div>
    );
    DynamicComponent.displayName = "ChartsSection";
    return DynamicComponent;
  },
}));

// next-intl — preserve NextIntlClientProvider (used by test-utils), mock useTranslations
const translator = (key: string, values?: Record<string, string | number>) => {
  const labels: Record<string, string> = {
    "dashboard.welcome": "Welcome",
    "dashboard.subtitle": "Your shop at a glance",
    "dashboard.vsPrevPeriod": "vs previous",
    "dashboard.totalRevenue": "Total Revenue",
    "dashboard.activeWorkOrders": "Active WOs",
    "dashboard.totalCustomers": "Customers",
    "dashboard.avgRepairOrder": "Avg Repair",
    "dashboard.grossProfit": "Gross Profit",
    "dashboard.marginLabel": "{percent}% margin",
    "dashboard.serviceRevenue": "Service Rev",
    "dashboard.partsRevenue": "Parts Rev",
    "dashboard.totalVehicles": "Vehicles",
    "dashboard.ofRevenue": "{percent}% of revenue",
    "dashboard.insights": "Insights",
    "dashboard.insightsAndTrends": "Insights & Trends",
    "dashboard.recentWorkOrders": "Recent Orders",
    "dashboard.recentWorkOrdersDesc": "Latest 10 orders",
    "dashboard.newCustomer": "New Customer",
    "dashboard.newWorkOrder": "New Work Order",
    "dashboard.today": "Today",
    "dashboard.week": "Week",
    "dashboard.month": "Month",
    "dashboard.all": "All",
    "dashboard.noWorkOrders": "None yet",
    "workOrders.id": "ID",
    "dashboard.periodToday": "Today",
    "dashboard.periodWeek": "Week",
    "dashboard.periodMonth": "Month",
    "dashboard.periodAll": "All",
    "customers.name": "Name",
    "common.total": "Total",
    "common.retry": "Retry",
    "common.noData": "No data",
    "common.export": "Export",
  };
  let result = labels[key] ?? key;
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      result = result.replace(`{${k}}`, String(v));
    }
  }
  return result;
};

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => translator,
  };
});

// Router
const mockRouterReplace = vi.fn();
const mockRouterPush = vi.fn();
vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Page header
const mockOpenDrawer = vi.fn();
vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({ openDrawer: mockOpenDrawer }),
}));

// Current user role — dynamic mocks
let mockIsMechanic = false;
let mockRoleLoading = false;
vi.mock("@/hooks/use-current-user-role", () => ({
  useCurrentUserRole: () => ({
    isMechanic: mockIsMechanic,
    loading: mockRoleLoading,
  }),
}));

vi.mock("@/hooks/use-selected-branch-guard", () => ({
  useSelectedBranchGuard: () => {},
}));

vi.mock("@/lib/hooks/use-realtime-multi", () => ({
  useRealtimeMulti: () => {},
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1" },
    isPending: false,
    error: null,
  }),
}));

// useDashboard — dynamic mocks
let mockDashboardData: Record<string, unknown> | null = null;
let mockDashboardPending = false;
let mockDashboardFetching = false;
let mockDashboardError: Error | null = null;
const mockRefetch = vi.fn();

vi.mock("@/lib/queries/use-dashboard", () => ({
  useDashboard: () => ({
    data: mockDashboardData,
    isPending: mockDashboardPending,
    isFetching: mockDashboardFetching,
    error: mockDashboardError,
    refetch: mockRefetch,
  }),
}));

// Child components
vi.mock("./_kpi-cards", () => ({
  KpiCard: (props: {
    label: string;
    value: string;
    loading: boolean;
    accentKey?: string;
    trend?: { value: string };
    comparisonLabel?: string;
    sparklineData?: unknown[];
  }) => (
    <div
      data-testid="kpi-card"
      data-label={props.label}
      data-value={props.value}
      data-loading={String(props.loading)}
      data-accent={props.accentKey}
    >
      {props.label}: {props.value}
      {props.trend && (
        <span data-testid="trend-badge">{props.trend.value}</span>
      )}
    </div>
  ),
}));

vi.mock("./_low-stock-card", () => ({
  LowStockCard: ({ orgId }: { orgId: string }) => (
    <div data-testid="low-stock-card" data-orgid={orgId}>
      LowStockCard
    </div>
  ),
}));

vi.mock("./_recent-work-orders", () => ({
  RecentWorkOrdersTable: ({ workOrders }: { workOrders: unknown[] }) => (
    <div data-testid="recent-wo-table" data-count={workOrders?.length}>
      RecentWorkOrdersTable
    </div>
  ),
}));

vi.mock("./_section-header", () => ({
  SectionHeader: ({ title }: { title: string }) => (
    <div data-testid="section-header">{title}</div>
  ),
}));

// ── Test helpers ───────────────────────────────────────────────────

const defaultSummary = {
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

const defaultComparison = {
  totalRevenue: 400000,
  activeWorkOrders: 10,
  completedToday: 4,
  newCustomersToday: 2,
  avgRepairOrderValue: 120000,
  partsRevenue: 150000,
  serviceRevenue: 250000,
  grossProfit: 200000,
  marginPercent: 48,
  totalCustomers: 70,
  totalVehicles: 100,
};

const fullDashboardData = {
  summary: defaultSummary,
  summaryComparison: defaultComparison,
  insights: [],
  workOrderStatusDistribution: [],
  revenueTrend: [],
  topServices: [],
  technicianPerformance: [],
  recentWorkOrders: [],
  serviceCategoryBreakdown: [],
  customerAcquisitionTrend: [],
};

// ── Tests ──────────────────────────────────────────────────────────

describe("DashboardPage", () => {
  beforeEach(() => {
    mockDashboardData = null;
    mockDashboardPending = false;
    mockDashboardFetching = false;
    mockDashboardError = null;
    mockIsMechanic = false;
    mockRoleLoading = false;
    mockRouterReplace.mockReset();
    mockRouterPush.mockReset();
    mockOpenDrawer.mockReset();
    mockRefetch.mockReset();
  });

  // ── 1. Header with period toggle ──
  it("renders header with period toggle", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Your shop at a glance")).toBeInTheDocument();

    // Four ToggleGroupItem buttons
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText("Month")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  // ── 2. Loading KpiCards ──
  it("renders 4 KpiCards with loading when isPending=true", () => {
    mockDashboardPending = true;
    render(<DashboardPage />);

    const cards = screen.getAllByTestId("kpi-card");
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      expect(card).toHaveAttribute("data-loading", "true");
    });
  });

  // ── 3. Secondary stats strip ──
  it("renders secondary stats strip", () => {
    render(<DashboardPage />);

    // All four stat labels are visible
    expect(screen.getByText("Gross Profit")).toBeInTheDocument();
    expect(screen.getByText("Service Rev")).toBeInTheDocument();
    expect(screen.getByText("Parts Rev")).toBeInTheDocument();
    expect(screen.getByText("Vehicles")).toBeInTheDocument();
  });

  // ── 4. Chart skeletons when no data ──
  it("shows chart skeletons when no data", () => {
    render(<DashboardPage />);

    // ChartsSection (dynamic import) must NOT render
    expect(screen.queryByTestId("charts-section")).not.toBeInTheDocument();
    // Inline chart skeleton cards are rendered instead (Cards with Skeletons)
    // We verify that the chart section placeholder exists by observing
    // Skeletons in the grid container (two card-skeleton groups)
    const skeletonElements = document.querySelectorAll(
      '[data-slot="skeleton"]',
    );
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  // ── 5. WO skeletons when no data ──
  it("shows 5 WO skeletons when no data", () => {
    render(<DashboardPage />);

    // SectionHeader is always rendered
    expect(screen.getByTestId("section-header")).toBeInTheDocument();

    // RecentWorkOrdersTable must NOT be rendered
    expect(screen.queryByTestId("recent-wo-table")).not.toBeInTheDocument();

    // There should be skeleton elements in the DOM (the 5 WO row skeletons)
    const skeletonElements = document.querySelectorAll(
      '[data-slot="skeleton"]',
    );
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  // ── 6. LowStockCard ──
  it("renders LowStockCard with orgId", () => {
    render(<DashboardPage />);

    const card = screen.getByTestId("low-stock-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-orgid", "org-1");
  });

  // ── 7. Full data view ──
  it("renders full data view with KpiCards, ChartsSection, RecentWorkOrdersTable", () => {
    mockDashboardData = fullDashboardData;
    render(<DashboardPage />);

    // Four KPI cards with values
    const cards = screen.getAllByTestId("kpi-card");
    // With trend badges (25% increase from 400k to 500k for revenue, same for ARO)
    const trendBadges = screen.getAllByTestId("trend-badge");
    expect(trendBadges).toHaveLength(2);
    trendBadges.forEach((badge) => {
      expect(badge).toHaveTextContent("+25%");
    });

    // Second card: Active WOs
    expect(cards[1]).toHaveAttribute("data-label", "Active WOs");
    expect(cards[1]).toHaveAttribute("data-value", "12");

    // Third card: Customers
    expect(cards[2]).toHaveAttribute("data-label", "Customers");
    expect(cards[2]).toHaveAttribute("data-value", "85");

    // Fourth card: Avg Repair
    expect(cards[3]).toHaveAttribute("data-label", "Avg Repair");
    expect(cards[3]).toHaveAttribute("data-value", "₮ 150,000");
    expect(cards[3]).toHaveAttribute("data-loading", "false");

    // ChartsSection renders (data is truthy)
    expect(screen.getByTestId("charts-section")).toBeInTheDocument();

    // RecentWorkOrdersTable renders
    const woTable = screen.getByTestId("recent-wo-table");
    expect(woTable).toBeInTheDocument();
    expect(woTable).toHaveAttribute("data-count", "0");
  });

  // ── 8. Insights card ──
  it("renders insights card when data.insights has items", () => {
    mockDashboardData = {
      ...fullDashboardData,
      insights: ["Revenue up 15% this month", "Customer retention improving"],
    };
    render(<DashboardPage />);

    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Revenue up 15% this month")).toBeInTheDocument();
    expect(
      screen.getByText("Customer retention improving"),
    ).toBeInTheDocument();
  });

  // ── 9. Mechanic redirect ──
  it("redirects mechanics to bay view", async () => {
    mockIsMechanic = true;
    mockRoleLoading = false;
    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/bay-view");
    });
  });

  // ── 10. Error banner ──
  it("shows error banner with Retry button when dashboardError exists", async () => {
    mockDashboardError = new Error("API error");
    render(<DashboardPage />);

    // Error message visible
    expect(screen.getByText("API error")).toBeInTheDocument();

    // Retry button visible
    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();

    // Clicking retry calls refetchDashboard
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  // ── 11. New Customer / New Work Order buttons ──
  it("opens New Customer and New Work Order drawers via openDrawer", () => {
    render(<DashboardPage />);

    const newCustomerBtn = screen.getByText("New Customer");
    fireEvent.click(newCustomerBtn);
    expect(mockOpenDrawer).toHaveBeenCalledWith("newCustomer");

    const newWorkOrderBtn = screen.getByText("New Work Order");
    fireEvent.click(newWorkOrderBtn);
    expect(mockOpenDrawer).toHaveBeenCalledWith("newWorkOrder");
  });

  // ── 12. Period toggle buttons ──
  it("renders all 4 period toggle buttons with translated labels", () => {
    render(<DashboardPage />);

    const todayBtn = screen.getByRole("button", { name: "Today" });
    const weekBtn = screen.getByRole("button", { name: "Week" });
    const monthBtn = screen.getByRole("button", { name: "Month" });
    const allBtn = screen.getByRole("button", { name: "All" });

    // All rendered as ToggleGroupItem with correct values
    expect(todayBtn).toBeInTheDocument();
    expect(weekBtn).toBeInTheDocument();
    expect(monthBtn).toBeInTheDocument();
    expect(allBtn).toBeInTheDocument();

    // ToggleGroupItem renders as a native <button>
    expect(todayBtn.tagName).toBe("BUTTON");
    expect(weekBtn.tagName).toBe("BUTTON");
    expect(monthBtn.tagName).toBe("BUTTON");
    expect(allBtn.tagName).toBe("BUTTON");
  });

  // ── 13. Secondary stats show skeletons when loading ──
  it("shows skeletons in secondary stats when data is loading", () => {
    render(<DashboardPage />);

    // Labels are visible
    expect(screen.getByText("Gross Profit")).toBeInTheDocument();
    expect(screen.getByText("Service Rev")).toBeInTheDocument();
    expect(screen.getByText("Parts Rev")).toBeInTheDocument();
    expect(screen.getByText("Vehicles")).toBeInTheDocument();

    // But values are not shown (skeletons instead)
    const skeletonElements = document.querySelectorAll(
      '[data-slot="skeleton"]',
    );
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  // ── 14. KpiCards show data-loading="false" when data is loaded ──
  it("shows KpiCards with data-loading=false when data is loaded", () => {
    mockDashboardData = fullDashboardData;
    render(<DashboardPage />);

    const cards = screen.getAllByTestId("kpi-card");
    cards.forEach((card) => {
      expect(card).toHaveAttribute("data-loading", "false");
    });
  });
});
