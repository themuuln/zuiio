import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MechanicTable } from "@/components/reports/mechanic-table";
import type { ExportColumn } from "@/lib/export";
import type { ReportComparison, ReportMechanicKpi } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      perMechanicBreakdown: "Per-mechanic breakdown",
      mechanicsSheet: "Mechanics",
      mechanic: "Mechanic",
      jobs: "Jobs",
      services: "Services",
      parts: "Parts",
      revenue: "Revenue",
      avgPerWo: "Avg / WO",
      vsPrevious: "vs previous",
      total: "Total",
      noDataForPeriod: "No data for this period",
    };
    return messages[key] ?? key;
  },
}));

vi.mock("@/components/export-button", () => ({
  ExportButton: () => (
    <button type="button" data-testid="export-button">
      Export
    </button>
  ),
}));

function makeKpi(overrides: Partial<ReportMechanicKpi>): ReportMechanicKpi {
  return {
    mechanic_id: "m1",
    mechanic_name: "Bold",
    work_orders_completed: 10,
    services_count: 12,
    parts_count: 8,
    total_revenue: 500000,
    avg_revenue_per_wo: 41667,
    avg_satisfaction: 4.5,
    total_reviews: 2,
    recent_reviews: [],
    ...overrides,
  };
}

const kpis = [
  makeKpi({
    mechanic_id: "m1",
    mechanic_name: "Bold",
    work_orders_completed: 10,
    services_count: 12,
    parts_count: 8,
    total_revenue: 500000,
    avg_revenue_per_wo: 50000,
  }),
  makeKpi({
    mechanic_id: "m2",
    mechanic_name: "Sara",
    work_orders_completed: 5,
    services_count: 6,
    parts_count: 4,
    total_revenue: 300000,
    avg_revenue_per_wo: 60000,
  }),
];

const exportCols: ExportColumn<ReportMechanicKpi>[] = [
  { key: "mechanic_name", header: "Mechanic" },
];

const comparison: ReportComparison = {
  work_orders_completed: 12,
  total_revenue: 700000,
  services_count: 15,
  parts_count: 10,
  revenue_change_pct: 14.3,
  work_orders_change_pct: null,
};

describe("MechanicTable", () => {
  it("renders the title and the export button", () => {
    render(
      <MechanicTable
        kpis={kpis}
        exportCols={exportCols}
        exportFile="mechanics.csv"
      />,
    );
    expect(screen.getByText("Per-mechanic breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("export-button")).toBeInTheDocument();
  });

  it("renders header labels and mechanic rows", () => {
    render(
      <MechanicTable
        kpis={kpis}
        exportCols={exportCols}
        exportFile="mechanics.csv"
      />,
    );
    for (const header of [
      "Mechanic",
      "Jobs",
      "Services",
      "Parts",
      "Revenue",
      "Avg / WO",
    ]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Sara")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    // 12 appears for Bold's services and in the parts total
    expect(screen.getAllByText("12").length).toBeGreaterThanOrEqual(1);
  });

  it("formats revenue cells with formatCurrency", () => {
    render(
      <MechanicTable
        kpis={kpis}
        exportCols={exportCols}
        exportFile="mechanics.csv"
      />,
    );
    expect(screen.getByText(formatCurrency(500000))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(50000))).toBeInTheDocument();
  });

  it("renders the totals row with summed values", () => {
    render(
      <MechanicTable
        kpis={kpis}
        exportCols={exportCols}
        exportFile="mechanics.csv"
      />,
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument(); // 10 + 5 jobs
    expect(screen.getByText("18")).toBeInTheDocument(); // 12 + 6 services
    // 12 = 8 + 4 parts total (also Bold's services count)
    expect(screen.getAllByText("12")).toHaveLength(2);
    expect(screen.getByText(formatCurrency(800000))).toBeInTheDocument();
  });

  it("omits the comparison column when no comparison is provided", () => {
    render(
      <MechanicTable
        kpis={kpis}
        exportCols={exportCols}
        exportFile="mechanics.csv"
      />,
    );
    expect(screen.queryByText("vs previous")).not.toBeInTheDocument();
  });

  it("renders per-mechanic deltas when a comparison is provided", () => {
    render(
      <MechanicTable
        kpis={kpis}
        exportCols={exportCols}
        exportFile="mechanics.csv"
        comparison={comparison}
      />,
    );
    expect(screen.getByText("vs previous")).toBeInTheDocument();
    // both mechanics keep the same proportional delta (62.5% / 37.5% of a
    // 700000 prev total) and the footer shows comparison.revenue_change_pct
    expect(screen.getAllByText("+14.3%")).toHaveLength(3);
  });

  it("renders a dash when delta cannot be computed", () => {
    const zeroRevenueComparison: ReportComparison = {
      ...comparison,
      total_revenue: 0,
      revenue_change_pct: null,
    };
    render(
      <MechanicTable
        kpis={kpis}
        exportCols={exportCols}
        exportFile="mechanics.csv"
        comparison={zeroRevenueComparison}
      />,
    );
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the empty message when there are no kpis", () => {
    render(
      <MechanicTable
        kpis={[]}
        exportCols={exportCols}
        exportFile="mechanics.csv"
      />,
    );
    expect(screen.getByText("No data for this period")).toBeInTheDocument();
  });
});
