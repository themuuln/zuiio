import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BarChart } from "@/components/charts/bar-chart";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({ ...props }: Record<string, unknown>) => (
      <div data-testid="bar-chart" data-props={JSON.stringify(props)} />
    ),
}));

const mockData = [
  { category: "Oil Change", count: 45, revenue: 9000 },
  { category: "Brakes", count: 30, revenue: 12000 },
];

const mockConfig: ChartConfig = {
  count: { label: "Count", color: "#3b82f6" },
  revenue: { label: "Revenue", color: "#10b981" },
};

describe("BarChart", () => {
  it("renders the dynamic chart component", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count" }]}
      />,
    );
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("passes data and config as props", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count" }]}
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props).toHaveProperty("data");
    expect(props).toHaveProperty("config");
    expect(props).toHaveProperty("xKey", "category");
  });

  it("passes series array with color", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count", color: "#3b82f6" }]}
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.series).toEqual([{ key: "count", color: "#3b82f6" }]);
  });

  it("passes explicit height when specified", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count" }]}
        height={350}
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.height).toBe(350);
  });

  it("passes stacked flag", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count" }, { key: "revenue" }]}
        stacked
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.stacked).toBe(true);
  });

  it("passes horizontal layout by default", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count" }]}
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.layout).toBeUndefined(); // default in inner component
  });

  it("passes vertical layout when specified", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count" }]}
        layout="vertical"
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.layout).toBe("vertical");
  });

  it("passes showGrid default (true)", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count" }]}
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.showGrid).toBeUndefined(); // defaulted in inner
  });

  it("passes showGrid = false when specified", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[{ key: "count" }]}
        showGrid={false}
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.showGrid).toBe(false);
  });

  it("renders with multiple series", () => {
    render(
      <BarChart
        data={mockData}
        config={mockConfig}
        xKey="category"
        series={[
          { key: "count", color: "#3b82f6" },
          { key: "revenue", color: "#10b981" },
        ]}
      />,
    );
    const chart = screen.getByTestId("bar-chart");
    const props = JSON.parse(chart.getAttribute("data-props") ?? "{}");
    expect(props.series).toHaveLength(2);
  });
});
