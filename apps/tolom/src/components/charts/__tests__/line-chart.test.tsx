import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LineChart } from "@/components/charts/line-chart";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({ ...props }: Record<string, unknown>) => (
      <div data-testid="line-chart" data-props={JSON.stringify(props)} />
    ),
}));

const mockData = [
  { month: "Jan", revenue: 100 },
  { month: "Feb", revenue: 150 },
];

const mockConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#3b82f6" },
};

describe("LineChart", () => {
  it("renders the dynamic chart component", () => {
    render(
      <LineChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("passes data, config and xKey as props", () => {
    render(
      <LineChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    const props = JSON.parse(
      screen.getByTestId("line-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.data).toEqual(mockData);
    expect(props.config).toEqual(mockConfig);
    expect(props.xKey).toBe("month");
  });

  it("passes series including dashed and color options", () => {
    render(
      <LineChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[
          { key: "revenue", color: "#3b82f6" },
          { key: "forecast", dashed: true },
        ]}
      />,
    );
    const props = JSON.parse(
      screen.getByTestId("line-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.series).toEqual([
      { key: "revenue", color: "#3b82f6" },
      { key: "forecast", dashed: true },
    ]);
  });

  it("passes explicit height when specified", () => {
    render(
      <LineChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }]}
        height={350}
      />,
    );
    const props = JSON.parse(
      screen.getByTestId("line-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.height).toBe(350);
  });

  it("passes showGrid and showDots flags", () => {
    render(
      <LineChart
        data={mockData}
        config={mockConfig}
        xKey="month"
        series={[{ key: "revenue" }]}
        showGrid={false}
        showDots={false}
      />,
    );
    const props = JSON.parse(
      screen.getByTestId("line-chart").getAttribute("data-props") ?? "{}",
    );
    expect(props.showGrid).toBe(false);
    expect(props.showDots).toBe(false);
  });
});
