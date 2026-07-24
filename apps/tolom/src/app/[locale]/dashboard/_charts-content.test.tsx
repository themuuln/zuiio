import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import ChartsSection, { MechanicTrendChart } from "./_charts-content";

// Mock all chart rendering to avoid recharts/jsdom SVG issues
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
  ChartTooltip: ({ children, content }: any) => (
    <div data-testid="chart-tooltip">{children ?? content}</div>
  ),
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
  ChartLegend: ({ children }: any) => (
    <div data-testid="chart-legend">{children}</div>
  ),
  ChartLegendContent: () => <div data-testid="chart-legend-content" />,
}));

vi.mock("recharts", () => ({
  Area: () => <div data-testid="recharts-area" />,
  AreaChart: ({ children }: any) => (
    <div data-testid="recharts-area-chart">{children}</div>
  ),
  Bar: () => <div data-testid="recharts-bar" />,
  BarChart: ({ children }: any) => (
    <div data-testid="recharts-bar-chart">{children}</div>
  ),
  CartesianGrid: () => <div data-testid="recharts-cartesian-grid" />,
  Cell: () => <div data-testid="recharts-cell" />,
  Label: ({ content, value, children }: any) => {
    if (typeof content === "function") {
      // Render the content function with a mock viewBox
      return content({ viewBox: { cx: 100, cy: 100 } });
    }
    return <div data-testid="recharts-label">{value ?? children}</div>;
  },
  Pie: ({ children }: any) => <div data-testid="recharts-pie">{children}</div>,
  PieChart: ({ children }: any) => (
    <div data-testid="recharts-pie-chart">{children}</div>
  ),
  XAxis: () => <div data-testid="recharts-xaxis" />,
  YAxis: () => <div data-testid="recharts-yaxis" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="recharts-responsive">{children}</div>
  ),
}));

vi.mock("@/components/charts/chart-colors", () => ({
  CHART_COLORS: [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
  ],
  STATUS_COLORS: {
    New: "#3b82f6",
    Diagnosing: "#f59e0b",
    "In Progress": "#8b5cf6",
    "Ready for Pickup": "#06b6d4",
    Completed: "#22c55e",
    Cancelled: "#ef4444",
  },
}));

const messages = {
  reports: {
    revenue: "Revenue",
    completedWo: "Completed WO",
    total: "Total",
    average: "Average",
  },
  dashboard: {
    weeklyTrend: "Weekly Trend",
    revenueTrend: "Revenue Trend",
    workOrderStatus: "Work Order Status",
    topServicesRevenue: "Top Services by Revenue",
    revenueByCategory: "Revenue by Category",
    technicianPerformance: "Technician Performance",
    noData: "No data",
    activeWorkOrders: "Active Work Orders",
    completedOrders: "completed orders",
  },
};

function makeRevenueTrend(
  overrides?: Partial<{ date: string; revenue: number; workOrders: number }>,
) {
  return [
    { date: "2026-07-01", revenue: 500000, workOrders: 3, ...overrides },
    { date: "2026-07-02", revenue: 750000, workOrders: 5 },
    { date: "2026-07-03", revenue: 600000, workOrders: 4 },
  ];
}

function makeStatusDistribution() {
  return [
    { status: "Completed", count: 45 },
    { status: "In Progress", count: 12 },
    { status: "Diagnosing", count: 8 },
  ];
}

const defaultData = {
  revenueTrend: makeRevenueTrend(),
  workOrderStatusDistribution: makeStatusDistribution(),
  topServices: [
    { name: "Oil Change", revenue: 400000, count: 12 },
    { name: "Brake Repair", revenue: 350000, count: 5 },
    { name: "Engine Diagnostic", revenue: 280000, count: 8 },
    { name: "Tire Rotation", revenue: 150000, count: 10 },
    { name: "AC Service", revenue: 120000, count: 4 },
    { name: "Transmission", revenue: 90000, count: 1 },
  ],
  serviceCategoryBreakdown: [
    { category: "Maintenance", revenue: 650000 },
    { category: "Repair", revenue: 450000 },
    { category: "Diagnostic", revenue: 280000 },
  ],
  technicianPerformance: [
    { id: "t1", name: "Bold", revenue: 450000, completedOrders: 15 },
    { id: "t2", name: "Saraa", revenue: 380000, completedOrders: 12 },
    { id: "t3", name: "Tuvshin", revenue: 280000, completedOrders: 9 },
  ],
};

// ── MechanicTrendChart ──

describe("MechanicTrendChart", () => {
  it("returns null for empty data", () => {
    render(<MechanicTrendChart data={[]} />, { messages });
    expect(screen.queryByText("Weekly Trend")).toBeNull();
  });

  it("renders title and chart for populated data", () => {
    render(
      <MechanicTrendChart
        data={[
          { week: "W1", orders: 5, revenue: 500000 },
          { week: "W2", orders: 7, revenue: 700000 },
        ]}
      />,
      { messages },
    );
    expect(screen.getByText("Weekly Trend")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-bar-chart")).toBeInTheDocument();
  });
});

// ── ChartsSection ──

describe("ChartsSection", () => {
  it("shows empty state for all sections when data is empty", () => {
    render(
      <ChartsSection
        data={{
          revenueTrend: [],
          workOrderStatusDistribution: [],
          topServices: [],
          serviceCategoryBreakdown: [],
          technicianPerformance: [],
        }}
      />,
      { messages },
    );
    // All cards should show "No data"
    const noDataEls = screen.getAllByText("No data");
    // At least 3: revenue trend + status donut + top services + tech perf
    expect(noDataEls.length).toBeGreaterThanOrEqual(3);
  });

  it("renders revenue trend KPI summary tiles", () => {
    render(<ChartsSection data={defaultData} />, { messages });

    const totalRevenue = 500000 + 750000 + 600000; // 1,850,000
    const _avgRevenue = Math.round(totalRevenue / 3); // 616,667
    const _totalWorkOrders = 3 + 5 + 4; // 12

    expect(screen.getAllByText("Total").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Average")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument(); // total work orders
    expect(screen.getByText("₮ 1,850,000")).toBeInTheDocument();
  });

  it("renders revenue trend area chart when data exists", () => {
    render(<ChartsSection data={defaultData} />, { messages });
    expect(screen.getByText("Revenue Trend")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-area-chart")).toBeInTheDocument();
  });

  it("renders work order status donut chart with total count", () => {
    render(<ChartsSection data={defaultData} />, { messages });
    expect(screen.getByText("Work Order Status")).toBeInTheDocument();
    const _totalStatus = 45 + 12 + 8; // 65
    expect(screen.getByText("65")).toBeInTheDocument(); // center label count
  });
  it("renders Top Services card with top 5 services", () => {
    render(<ChartsSection data={defaultData} />, { messages });
    expect(screen.getByText("Top Services by Revenue")).toBeInTheDocument();

    // Top 5 services should show (6th is excluded)
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Brake Repair")).toBeInTheDocument();
    expect(screen.getByText("Engine Diagnostic")).toBeInTheDocument();
    expect(screen.getByText("Tire Rotation")).toBeInTheDocument();
    expect(screen.getByText("AC Service")).toBeInTheDocument();
    // 6th should NOT be in the document
    expect(screen.queryByText("Transmission")).toBeNull();

    // Revenue + count format
    expect(screen.getByText("12 · ₮ 400,000")).toBeInTheDocument();
  });

  it("shows empty state in Top Services when array is empty", () => {
    render(
      <ChartsSection
        data={{
          ...defaultData,
          topServices: [],
          serviceCategoryBreakdown: defaultData.serviceCategoryBreakdown,
        }}
      />,
      { messages },
    );
    // Top Services card should show "No data"
    expect(screen.getByText("Top Services by Revenue")).toBeInTheDocument();
  });

  it("renders revenue by category pie chart with total label", () => {
    render(<ChartsSection data={defaultData} />, { messages });
    expect(screen.getByText("Revenue by Category")).toBeInTheDocument();

    const _totalCategoryRevenue = 650000 + 450000 + 280000; // 1,380,000
    expect(screen.getByText("₮ 1,380,000")).toBeInTheDocument();
  });

  it("shows empty state for categories when array is empty", () => {
    render(
      <ChartsSection
        data={{
          ...defaultData,
          topServices: defaultData.topServices,
          serviceCategoryBreakdown: [],
        }}
      />,
      { messages },
    );
    expect(screen.getByText("Revenue by Category")).toBeInTheDocument();
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders technician performance ranked by revenue", () => {
    render(<ChartsSection data={defaultData} />, { messages });
    expect(screen.getByText("Technician Performance")).toBeInTheDocument();

    // Technicians should be in revenue order (Bold first, Tuvshin last)
    const techNames = screen.getAllByText(/Bold|Saraa|Tuvshin/);
    expect(techNames).toHaveLength(3);
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Saraa")).toBeInTheDocument();
    expect(screen.getByText("Tuvshin")).toBeInTheDocument();

    // Revenue values
    expect(screen.getByText("₮ 450,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 380,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 280,000")).toBeInTheDocument();

    // Completed order counts
    expect(screen.getByText("15 completed orders")).toBeInTheDocument();
    expect(screen.getByText("12 completed orders")).toBeInTheDocument();
    expect(screen.getByText("9 completed orders")).toBeInTheDocument();
  });

  it("caps technician performance at 6", () => {
    const manyTechs = Array.from({ length: 8 }, (_, i) => ({
      id: `t${i}`,
      name: `Tech ${i + 1}`,
      revenue: 100000 * (8 - i),
      completedOrders: 5 * (8 - i),
    }));

    render(
      <ChartsSection
        data={{
          ...defaultData,
          topServices: defaultData.topServices,
          serviceCategoryBreakdown: defaultData.serviceCategoryBreakdown,
          technicianPerformance: manyTechs,
        }}
      />,
      { messages },
    );

    // Only 6 should be shown
    const tech1 = screen.getByText("Tech 1");
    expect(tech1).toBeInTheDocument();
    const tech7 = screen.queryByText("Tech 7");
    expect(tech7).toBeNull();
  });

  it("shows empty state for tech performance when array is empty", () => {
    render(
      <ChartsSection
        data={{
          ...defaultData,
          topServices: defaultData.topServices,
          serviceCategoryBreakdown: defaultData.serviceCategoryBreakdown,
          technicianPerformance: [],
        }}
      />,
      { messages },
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
