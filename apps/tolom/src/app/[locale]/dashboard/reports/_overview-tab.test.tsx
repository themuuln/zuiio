import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { OverviewTab } from "./_overview-tab";

// Mock all child report components
vi.mock("@/components/reports", () => ({
  DailyRevenueChart: ({ data }: any) => (
    <div data-testid="daily-revenue-chart" data-items={data?.length}>
      DailyRevenueChart
    </div>
  ),
  ForecastCard: () => <div data-testid="forecast-card">ForecastCard</div>,
  InsightAlerts: ({ insights, loading }: any) => (
    <div
      data-testid="insight-alerts"
      data-loading={String(loading)}
      data-insights={insights?.length}
    >
      InsightAlerts
    </div>
  ),
  MechanicBarChart: ({ kpis }: any) => (
    <div data-testid="mechanic-bar-chart" data-kpis={kpis?.length}>
      MechanicBarChart
    </div>
  ),
  MechanicTable: ({ kpis }: any) => (
    <div data-testid="mechanic-table" data-kpis={kpis?.length}>
      MechanicTable
    </div>
  ),
  PnLCard: () => <div data-testid="pnl-card">PnLCard</div>,
  ReportKpiCard: ({ label, value, delta, subtitle }: any) => (
    <div
      data-testid="report-kpi-card"
      data-label={label}
      data-value={value}
      data-delta={delta ?? "none"}
    >
      {label}: {value}
      {subtitle && <span data-testid="kpi-subtitle">{subtitle}</span>}
    </div>
  ),
  RetentionCard: () => <div data-testid="retention-card">RetentionCard</div>,
  ServiceBreakdownChart: () => (
    <div data-testid="service-breakdown-chart">ServiceBreakdownChart</div>
  ),
  TargetCard: () => <div data-testid="target-card">TargetCard</div>,
}));

// Mock recharts for the inline revenue split pie
vi.mock("recharts", () => ({
  Cell: () => <div data-testid="recharts-cell" />,
  Pie: ({ children, data }: any) => (
    <div data-testid="recharts-pie">{children}</div>
  ),
  PieChart: ({ children }: any) => (
    <div data-testid="recharts-piechart">{children}</div>
  ),
}));

// Mock shadcn chart components
vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children, config, className }: any) => (
    <div
      data-testid="chart-container"
      data-config-keys={Object.keys(config ?? {}).join(",")}
      className={className}
    >
      {children}
    </div>
  ),
  ChartTooltip: ({ children }: any) => (
    <div data-testid="chart-tooltip">{children}</div>
  ),
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}));

function makeReportData(overrides: Record<string, unknown> = {}) {
  return {
    work_orders_completed: 25,
    services_count: 48,
    parts_count: 62,
    total_revenue: 4500000,
    total_discounts: 120000,
    comparison: null,
    profitability: null,
    mechanic_kpis: [
      {
        mechanic_id: "m1",
        mechanic_name: "Bold",
        work_orders_completed: 10,
        total_revenue: 2000000,
      },
      {
        mechanic_id: "m2",
        mechanic_name: "Saraa",
        work_orders_completed: 8,
        total_revenue: 1500000,
      },
    ],
    ...overrides,
  };
}

const t = (key: string, _values?: Record<string, string | number>) => {
  const labels: Record<string, string> = {
    workOrders: "Work Orders",
    servicesSold: "Services Sold",
    revenue: "Revenue",
    expenses: "Expenses",
    grossProfit: "Gross Profit",
    margin: "Margin",
    effLaborRate: "Eff. Labor Rate",
    partsToLabor: "Parts/Labor",
    averagePerWorkOrder: "Avg {value}/WO",
    servicesPerWorkOrder: "{value}/WO",
    previousRevenue: "Prev {value}",
    connectExpenseData: "Connect expense data",
    perWorkOrder: "per WO",
    partsOverLabor: "parts/labor",
    revenueSplit: "Revenue Split",
    profitBreakdown: "Profit Breakdown",
    serviceRevenue: "Service Revenue",
    serviceCost: "Service Cost",
    partsRevenue: "Parts Revenue",
    partsCost: "Parts Cost",
    services: "Services",
    parts: "Parts",
  };
  let result = labels[key] ?? key;
  if (_values) {
    for (const [k, v] of Object.entries(_values)) {
      result = result.replace(`{${k}}`, String(v));
    }
  }
  return result;
};

const baseProps = {
  reportType: "daily" as const,
  report: makeReportData() as any,
  loading: false,
  insights: [],
  forecast: null,
  targets: [],
  retention: null,
  pnl: null,
  serviceBreakdown: [],
  dailyBreakdown: [],
  monthlyBreakdown: [],
  mechExportCols: [],
  dateParam: "2026-07-22",
  mechanicFilter: "",
  t,
};

describe("OverviewTab", () => {
  it("renders InsightAlerts with insights and loading state", () => {
    render(
      <OverviewTab
        {...baseProps}
        insights={[
          {
            id: "i1",
            severity: "warning",
            title: "Low margin",
            description: "",
            metric: "",
            value: 0,
          },
        ]}
        loading
      />,
    );
    const alerts = screen.getByTestId("insight-alerts");
    expect(alerts).toBeInTheDocument();
    expect(alerts).toHaveAttribute("data-insights", "1");
    expect(alerts).toHaveAttribute("data-loading", "true");
  });

  it("renders 4 KPI cards with zero values when report is null", () => {
    render(<OverviewTab {...baseProps} report={null} />);
    const cards = screen.getAllByTestId("report-kpi-card");
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveAttribute("data-value", "0");
    expect(cards[2]).toHaveAttribute("data-value", "₮ 0");
  });

  it("renders 4 KPI cards with report values", () => {
    render(<OverviewTab {...baseProps} />);
    const cards = screen.getAllByTestId("report-kpi-card");
    expect(cards[0]).toHaveTextContent("25");
    expect(cards[1]).toHaveTextContent("48");
    expect(cards[2]).toHaveTextContent("₮ 4,500,000");
  });

  it("renders average per work order subtitle", () => {
    render(<OverviewTab {...baseProps} />);
    expect(screen.getByText(/Avg.*WO/)).toBeInTheDocument();
  });

  it("shows profitability section when report.profitability is provided", () => {
    const profitability = {
      gross_profit: 1800000,
      margin_percent: 40,
      service_revenue: 3000000,
      service_cost: 1500000,
      parts_revenue: 1500000,
      parts_cost: 1200000,
      effective_labor_rate: 45000,
      parts_to_labor_ratio: 0.55,
    };
    render(
      <OverviewTab
        {...baseProps}
        report={makeReportData({ profitability }) as any}
      />,
    );

    // Profit KPI cards
    const cards = screen.getAllByTestId("report-kpi-card");
    // First 4 are main KPI cards, then 4 profitability KPI cards
    const profitCards = cards.slice(4, 8);
    expect(profitCards).toHaveLength(4);
    expect(profitCards[0]).toHaveTextContent("₮ 1,800,000");
    expect(profitCards[1]).toHaveTextContent("40%");
    expect(profitCards[2]).toHaveTextContent("₮ 45,000");
    expect(profitCards[3]).toHaveTextContent("55%");

    // Revenue split donut should be visible
    expect(screen.getByText("Revenue Split")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-piechart")).toBeInTheDocument();

    // Services / parts labels with values and percentages
    expect(screen.getAllByText("Services").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Parts").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("₮ 3,000,000").length).toBe(2); // revenue split + profit breakdown
    expect(screen.getAllByText("(67%)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("(33%)").length).toBeGreaterThanOrEqual(1);

    // Profit breakdown section
    expect(screen.getByText("Profit Breakdown")).toBeInTheDocument();
    expect(screen.getAllByText("₮ 1,500,000").length).toBe(2); // revenue split parts + profit breakdown
    expect(screen.getByText("-₮ 1,500,000")).toBeInTheDocument(); // service cost
    expect(screen.getByText("-₮ 1,200,000")).toBeInTheDocument(); // parts cost
  });

  it("renders ForecastCard and TargetCard", () => {
    render(<OverviewTab {...baseProps} />);
    expect(screen.getByTestId("forecast-card")).toBeInTheDocument();
    expect(screen.getByTestId("target-card")).toBeInTheDocument();
  });

  it("hides profitability section when profitability is null", () => {
    render(<OverviewTab {...baseProps} />);
    expect(screen.queryByText("Revenue Split")).toBeNull();
    expect(screen.queryByText("Profit Breakdown")).toBeNull();
  });

  it("shows DailyRevenueChart for weekly reports", () => {
    render(
      <OverviewTab
        {...baseProps}
        reportType="weekly"
        dailyBreakdown={[{ date: "2026-07-20", revenue: 500000, label: "Mon" }]}
      />,
    );
    const chart = screen.getByTestId("daily-revenue-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute("data-items", "1");
  });

  it("shows DailyRevenueChart for monthly reports", () => {
    render(
      <OverviewTab
        {...baseProps}
        reportType="monthly"
        monthlyBreakdown={[
          { date: "2026-07-01", revenue: 500000, label: "W1" },
        ]}
      />,
    );
    const chart = screen.getByTestId("daily-revenue-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute("data-items", "1");
  });

  it("does not show DailyRevenueChart for daily reports", () => {
    render(<OverviewTab {...baseProps} />);
    expect(screen.queryByTestId("daily-revenue-chart")).toBeNull();
  });

  it("shows MechanicBarChart and MechanicTable when no mechanic filter", () => {
    render(<OverviewTab {...baseProps} />);
    expect(screen.getByTestId("mechanic-bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("mechanic-table")).toBeInTheDocument();
  });

  it("hides MechanicBarChart and MechanicTable when mechanicFilter is set", () => {
    render(<OverviewTab {...baseProps} mechanicFilter="m1" />);
    expect(screen.queryByTestId("mechanic-bar-chart")).toBeNull();
    expect(screen.queryByTestId("mechanic-table")).toBeNull();
  });

  it("passes mechanic_kpis to MechanicBarChart and MechanicTable", () => {
    render(<OverviewTab {...baseProps} />);
    expect(screen.getByTestId("mechanic-bar-chart")).toHaveAttribute(
      "data-kpis",
      "2",
    );
    expect(screen.getByTestId("mechanic-table")).toHaveAttribute(
      "data-kpis",
      "2",
    );
  });

  it("renders ServiceBreakdownChart, RetentionCard, and PnLCard", () => {
    render(<OverviewTab {...baseProps} />);
    expect(screen.getByTestId("service-breakdown-chart")).toBeInTheDocument();
    expect(screen.getByTestId("retention-card")).toBeInTheDocument();
    expect(screen.getByTestId("pnl-card")).toBeInTheDocument();
  });

  it("computes comparison delta for services sold KPI", () => {
    const report = makeReportData({
      services_count: 50,
      comparison: {
        total_revenue: 4000000,
        work_orders_completed: 20,
        services_count: 40,
        revenue_change_pct: 10,
        work_orders_change_pct: 20,
      },
    });
    render(<OverviewTab {...baseProps} report={report as any} />);
    const cards = screen.getAllByTestId("report-kpi-card");
    // delta = rounds ((50 - 40) / 40 * 1000) / 10 = 25
    expect(cards[1]).toHaveAttribute("data-delta", "25");
  });

  it("sets delta to null when services_count is 0", () => {
    const report = makeReportData({
      services_count: 0,
      comparison: {
        total_revenue: 4000000,
        work_orders_completed: 20,
        services_count: 40,
        revenue_change_pct: 10,
        work_orders_change_pct: 20,
      },
    });
    render(<OverviewTab {...baseProps} report={report as any} />);
    const cards = screen.getAllByTestId("report-kpi-card");
    expect(cards[1]).toHaveAttribute("data-delta", "none");
  });

  it("renders tabpanel with correct id and aria attributes", () => {
    render(<OverviewTab {...baseProps} />);
    const panel = document.getElementById("reports-panel-daily");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("aria-labelledby", "reports-tab-daily");
  });
});
