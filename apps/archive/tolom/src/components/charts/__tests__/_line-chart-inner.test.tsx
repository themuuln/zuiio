import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LineChartInner from "@/components/charts/_line-chart-inner";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

const data = [
  { month: "Jan", revenue: 100 },
  { month: "Feb", revenue: 150 },
];

const config: ChartConfig = {
  revenue: { label: "Revenue", color: "#3b82f6" },
};

function renderChart(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

function propsOf(el: Element): Record<string, unknown> {
  return JSON.parse(el.getAttribute("data-props") ?? "{}");
}

describe("LineChartInner", () => {
  it("renders a ChartContainer with height class", () => {
    const { $ } = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
        height={350}
      />,
    );
    const chart = $("[data-slot='chart']");
    expect(chart).toBeInTheDocument();
    expect(chart?.className).toContain("h-[350px]");
  });

  it("defaults height to 300", () => {
    const { $ } = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    expect($("[data-slot='chart']")?.className).toContain("h-[300px]");
  });

  it("passes data and margin to the recharts chart", () => {
    const { $ } = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    const chart = $("[data-testid='recharts-line-chart']");
    expect(chart).toBeInTheDocument();
    const props = propsOf(chart as Element);
    expect(props.data).toEqual(data);
    expect(props.margin).toEqual({ top: 4, right: 4, bottom: 4, left: 4 });
  });

  it("renders XAxis with the xKey as dataKey", () => {
    const { $ } = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    const xAxis = $("[data-testid='recharts-x-axis']");
    expect(xAxis).toBeInTheDocument();
    expect(propsOf(xAxis as Element).dataKey).toBe("month");
  });

  it("renders one Line per series with color and stroke width", () => {
    const { $$ } = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue", color: "#10b981" }, { key: "count" }]}
      />,
    );
    const lines = $$("[data-testid='recharts-line']");
    expect(lines).toHaveLength(2);
    expect(propsOf(lines[0]).stroke).toBe("#10b981");
    expect(propsOf(lines[1]).stroke).toBe("var(--color-count)");
    expect(propsOf(lines[0]).strokeWidth).toBe(2);
  });

  it("renders dashed lines when series has dashed flag", () => {
    const { $ } = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue", dashed: true }]}
      />,
    );
    const line = $("[data-testid='recharts-line']");
    expect(propsOf(line as Element).strokeDasharray).toBe("4 4");
  });

  it("hides dots when showDots is false", () => {
    const { $ } = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
        showDots={false}
      />,
    );
    expect(propsOf($("[data-testid='recharts-line']") as Element).dot).toBe(
      false,
    );
  });

  it("renders CartesianGrid by default and hides it when showGrid is false", () => {
    const first = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    expect(
      first.$("[data-testid='recharts-cartesian-grid']"),
    ).toBeInTheDocument();
    first.unmount();

    const second = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
        showGrid={false}
      />,
    );
    expect(
      second.$("[data-testid='recharts-cartesian-grid']"),
    ).not.toBeInTheDocument();
  });

  it("renders a chart tooltip with line indicator", () => {
    const { $ } = renderChart(
      <LineChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    expect($("[data-testid='recharts-tooltip']")).toBeInTheDocument();
  });
});
