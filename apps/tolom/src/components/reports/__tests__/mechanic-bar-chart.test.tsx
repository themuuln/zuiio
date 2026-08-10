import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MechanicBarChart } from "@/components/reports/mechanic-bar-chart";
import type { ReportMechanicKpi } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      mechanicPerformance: "Mechanic performance",
      revenue: "Revenue",
      noDataForPeriod: "No data for this period",
    };
    return messages[key] ?? key;
  },
}));

vi.mock("@/components/charts", () => ({
  BarChart: ({ ...props }: Record<string, unknown>) => (
    <div data-testid="bar-chart" data-props={JSON.stringify(props)} />
  ),
}));

function makeKpi(overrides: Partial<ReportMechanicKpi>): ReportMechanicKpi {
  return {
    mechanic_id: "m1",
    mechanic_name: "Bold Bat",
    work_orders_completed: 10,
    services_count: 12,
    parts_count: 8,
    total_revenue: 500000,
    avg_revenue_per_wo: 50000,
    avg_satisfaction: 4.5,
    total_reviews: 2,
    recent_reviews: [],
    ...overrides,
  };
}

const kpis = Array.from({ length: 10 }, (_, i) =>
  makeKpi({
    mechanic_id: `m${i}`,
    mechanic_name: `Mechanic ${i} Name`,
    total_revenue: 1000 * (i + 1),
  }),
);

describe("MechanicBarChart", () => {
  it("renders the card title", () => {
    render(<MechanicBarChart kpis={kpis} />);
    expect(screen.getByText("Mechanic performance")).toBeInTheDocument();
  });

  it("passes at most 8 mechanics with first-name-only labels", () => {
    render(<MechanicBarChart kpis={kpis} />);
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.data).toHaveLength(8);
    expect(props.data[0]).toEqual({ name: "Mechanic", revenue: 1000 });
    expect(props.height).toBe(220);
    expect(props.xKey).toBe("name");
  });

  it("passes the revenue series with themed color", () => {
    render(<MechanicBarChart kpis={kpis} />);
    const props = JSON.parse(
      screen.getByTestId("bar-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.series).toEqual([{ key: "revenue", color: "var(--chart-1)" }]);
    expect(props.config.revenue.label).toBe("Revenue");
  });

  it("shows the empty message when there are no kpis", () => {
    render(<MechanicBarChart kpis={[]} />);
    expect(screen.getByText("No data for this period")).toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });
});
