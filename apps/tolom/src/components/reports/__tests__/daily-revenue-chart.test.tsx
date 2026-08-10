import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DailyRevenueChart } from "@/components/reports/daily-revenue-chart";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      dailyRevenue: "Daily revenue",
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

const sampleData = [
  { date: "2026-08-01", revenue: 120000, label: "Aug 1" },
  { date: "2026-08-02", revenue: 80000, label: "Aug 2" },
];

describe("DailyRevenueChart", () => {
  it("renders the card title", () => {
    render(<DailyRevenueChart data={sampleData} />);
    expect(screen.getByText("Daily revenue")).toBeInTheDocument();
  });

  it("renders the bar chart with the revenue series and 200 height", () => {
    render(<DailyRevenueChart data={sampleData} />);
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.data).toEqual(sampleData);
    expect(props.xKey).toBe("label");
    expect(props.height).toBe(200);
    expect(props.series).toEqual([{ key: "revenue", color: "var(--chart-1)" }]);
    expect(props.config.revenue.label).toBe("Revenue");
  });

  it("shows the empty message and no chart when data is empty", () => {
    render(<DailyRevenueChart data={[]} />);
    expect(screen.getByText("No data for this period")).toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });
});
