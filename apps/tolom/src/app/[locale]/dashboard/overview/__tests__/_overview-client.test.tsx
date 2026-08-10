import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import OverviewPage from "../_overview-client";

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
    "dashboard.totalRevenue": "Total Revenue",
    "dashboard.activeWorkOrders": "Active WOs",
    "dashboard.totalCustomers": "Customers",
    "dashboard.avgRepairOrder": "Avg Repair",
    "dashboard.recentWorkOrders": "Recent Orders",
    "dashboard.recentWorkOrdersDesc": "Latest 10 orders",
    "common.retry": "Retry",
    "common.noData": "No data",
    "common.total": "Total",
    "workOrders.id": "ID",
    "customers.name": "Name",
    "workOrders.vehicle": "Vehicle",
    "workOrders.status": "Status",
    "workOrders.date": "Date",
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

// useCurrentOrg — dynamic mocks
let mockOrgData: { orgId: string } | null = null;
let mockOrgPending = false;
let mockOrgError: Error | null = null;
vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: mockOrgData,
    isPending: mockOrgPending,
    error: mockOrgError,
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
vi.mock("../../_kpi-cards", () => ({
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

vi.mock("../../_recent-work-orders", () => ({
  RecentWorkOrdersTable: ({ workOrders }: { workOrders: unknown[] }) => (
    <div data-testid="recent-wo-table" data-count={workOrders?.length}>
      RecentWorkOrdersTable
    </div>
  ),
}));

vi.mock("../../_section-header", () => ({
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

const zeroSummary = {
  totalRevenue: 0,
  activeWorkOrders: 0,
  completedToday: 0,
  newCustomersToday: 0,
  avgRepairOrderValue: 0,
  partsRevenue: 0,
  serviceRevenue: 0,
  grossProfit: 0,
  marginPercent: 0,
  totalCustomers: 0,
  totalVehicles: 0,
};

const fullDashboardData = {
  summary: defaultSummary,
  summaryComparison: null,
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

describe("OverviewPage", () => {
  beforeEach(() => {
    mockOrgData = { orgId: "org-1" };
    mockOrgPending = false;
    mockOrgError = null;
    mockDashboardData = null;
    mockDashboardPending = false;
    mockDashboardFetching = false;
    mockDashboardError = null;
    mockIsMechanic = false;
    mockRoleLoading = false;
    mockRouterReplace.mockReset();
    mockRouterPush.mockReset();
    mockRefetch.mockReset();
  });

  // ── 1. Header ──
  it("renders welcome header and subtitle", () => {
    render(<OverviewPage />);

    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Your shop at a glance")).toBeInTheDocument();
  });

  // ── 2. KPI data render ──
  it("renders 4 KPI cards with formatted currency and counts", () => {
    mockDashboardData = fullDashboardData;
    render(<OverviewPage />);

    const cards = screen.getAllByTestId("kpi-card");
    expect(cards).toHaveLength(4);

    expect(cards[0]).toHaveAttribute("data-label", "Total Revenue");
    expect(cards[0]).toHaveAttribute("data-value", "₮ 500,000");
    expect(cards[0]).toHaveAttribute("data-accent", "totalRevenue");

    expect(cards[1]).toHaveAttribute("data-label", "Active WOs");
    expect(cards[1]).toHaveAttribute("data-value", "12");

    expect(cards[2]).toHaveAttribute("data-label", "Customers");
    expect(cards[2]).toHaveAttribute("data-value", "85");

    expect(cards[3]).toHaveAttribute("data-label", "Avg Repair");
    expect(cards[3]).toHaveAttribute("data-value", "₮ 150,000");
    expect(cards[3]).toHaveAttribute("data-accent", "avgRepairOrder");

    cards.forEach((card) => {
      expect(card).toHaveAttribute("data-loading", "false");
    });

    // Charts render once data is available
    expect(screen.getByTestId("charts-section")).toBeInTheDocument();
  });

  // ── 3. Loading KPI cards ──
  it("renders 4 KPI cards with loading=true while dashboard is pending", () => {
    mockDashboardPending = true;
    render(<OverviewPage />);

    const cards = screen.getAllByTestId("kpi-card");
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      expect(card).toHaveAttribute("data-loading", "true");
    });

    // No charts while data is missing
    expect(screen.queryByTestId("charts-section")).not.toBeInTheDocument();
  });

  // ── 4. Org loading skeletons ──
  it("shows header and KPI skeletons while the org is loading", () => {
    mockOrgData = null;
    mockOrgPending = true;
    render(<OverviewPage />);

    // Inline skeleton pattern: page title/description are real text on frame 1
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Your shop at a glance")).toBeInTheDocument();
    expect(screen.queryByTestId("kpi-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("charts-section")).not.toBeInTheDocument();
    expect(screen.queryByTestId("recent-wo-table")).not.toBeInTheDocument();

    const skeletonElements = document.querySelectorAll(
      '[data-slot="skeleton"]',
    );
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  // ── 5. Zero data ──
  it("renders zeroed KPI values when summary is all zeros", () => {
    mockDashboardData = { ...fullDashboardData, summary: zeroSummary };
    render(<OverviewPage />);

    const cards = screen.getAllByTestId("kpi-card");
    expect(cards[0]).toHaveAttribute("data-value", "₮ 0");
    expect(cards[1]).toHaveAttribute("data-value", "0");
    expect(cards[2]).toHaveAttribute("data-value", "0");
    expect(cards[3]).toHaveAttribute("data-value", "₮ 0");
  });

  // ── 6. Recent work orders table ──
  it("passes recent work orders to RecentWorkOrdersTable", () => {
    mockDashboardData = {
      ...fullDashboardData,
      recentWorkOrders: [{ id: "wo-1" }, { id: "wo-2" }],
    };
    render(<OverviewPage />);

    expect(screen.getByTestId("section-header")).toHaveTextContent(
      "Recent Orders",
    );
    const woTable = screen.getByTestId("recent-wo-table");
    expect(woTable).toBeInTheDocument();
    expect(woTable).toHaveAttribute("data-count", "2");
  });

  // ── 7. Empty state ──
  it("renders no charts but an empty recent work orders section when there is no data", () => {
    render(<OverviewPage />);

    expect(screen.queryByTestId("charts-section")).not.toBeInTheDocument();

    // Recent work orders section still renders with zero rows
    expect(screen.getByTestId("section-header")).toBeInTheDocument();
    const woTable = screen.getByTestId("recent-wo-table");
    expect(woTable).toBeInTheDocument();
    expect(woTable).toHaveAttribute("data-count", "0");
  });

  // ── 8. Dashboard error ──
  it("shows dashboard error banner and refetches on Retry", async () => {
    mockDashboardError = new Error("API error");
    render(<OverviewPage />);

    expect(screen.getByText("API error")).toBeInTheDocument();

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  // ── 9. Org error ──
  it("shows org error banner and reloads the page on Retry", () => {
    mockOrgData = null;
    mockOrgPending = false;
    mockOrgError = new Error("Org API error");

    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadMock },
    });
    render(<OverviewPage />);

    expect(screen.getByText("No data")).toBeInTheDocument();

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  // ── 10. Mechanic redirect ──
  it("redirects mechanics to bay view", async () => {
    mockIsMechanic = true;
    mockRoleLoading = false;
    render(<OverviewPage />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/bay-view");
    });
  });

  // ── 11. No-org redirect ──
  it("redirects to select-organization when no org is selected", async () => {
    mockOrgData = null;
    mockOrgPending = false;
    mockOrgError = null;
    render(<OverviewPage />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/auth/select-organization?returnUrl=/dashboard/overview",
      );
    });
  });

  // ── 12. Stale data with error ──
  it("keeps showing dashboard content when an error arrives after data", () => {
    mockDashboardData = fullDashboardData;
    mockDashboardError = new Error("Background refresh failed");
    render(<OverviewPage />);

    // No error banner — stale data stays visible
    expect(
      screen.queryByText("Background refresh failed"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId("kpi-card")).toHaveLength(4);
    expect(screen.getByTestId("charts-section")).toBeInTheDocument();
    expect(screen.getByTestId("recent-wo-table")).toBeInTheDocument();
  });
});
