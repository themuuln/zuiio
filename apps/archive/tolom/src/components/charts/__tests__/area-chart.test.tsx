import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AreaChart } from "@/components/charts/area-chart";
import type { ChartConfig } from "@/components/ui/chart";

// next/dynamic returns a component that renders a div with test id and props
vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({ ...props }: Record<string, unknown>) => (
      <div data-testid="area-chart" data-props={JSON.stringify(props)} />
    ),
}));

const mockData = [
  { month: "Jan", revenue: 1000, costs: 600 },
  { month: "Feb", revenue: 1200, costs: 700 },
];

const mockConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#10b981" },
  costs: { label: "Costs", color: "#ef4444" },
};

describe("AreaChart", () => {
  it("renders the dynamic chart component", () => {
    render(
      <AreaChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }, { key: "costs" }]}
      />,
    );
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("passes data and config as props", () => {
    render(
      <AreaChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    const chart = screen.getByTestId("area-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props).toHaveProperty("data");
    expect(props).toHaveProperty("config");
    expect(props).toHaveProperty("xKey", "month");
  });

  it("passes series array", () => {
    render(
      <AreaChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[
          { key: "revenue", color: "#10b981" },
          { key: "costs", color: "#ef4444" },
        ]}
      />,
    );
    const chart = screen.getByTestId("area-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    const series = props.series as Array<{ key: string; color?: string }>;
    expect(series).toHaveLength(2);
    expect(series[0]).toEqual({ key: "revenue", color: "#10b981" });
  });

  it("passes default height when not specified", () => {
    render(
      <AreaChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    const chart = screen.getByTestId("area-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.height).toBeUndefined(); // height is defaulted in inner component
  });

  it("passes explicit height when specified", () => {
    render(
      <AreaChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }]}
        height={400}
      />,
    );
    const chart = screen.getByTestId("area-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.height).toBe(400);
  });

  it("passes stacked flag", () => {
    render(
      <AreaChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }, { key: "costs" }]}
        stacked
      />,
    );
    const chart = screen.getByTestId("area-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.stacked).toBe(true);
  });
});
