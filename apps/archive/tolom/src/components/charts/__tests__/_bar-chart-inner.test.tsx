import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BarChartInner from "@/components/charts/_bar-chart-inner";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

const data = [
  { category: "Oil Change", count: 45 },
  { category: "Brakes", count: 30 },
];

const config: ChartConfig = {
  count: { label: "Count", color: "#3b82f6" },
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

describe("BarChartInner", () => {
  it("renders a ChartContainer with height class and passes data", () => {
    const { $ } = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }]}
        height={220}
      />,
    );
    const chart = $("[data-slot='chart']");
    expect(chart).toBeInTheDocument();
    expect(chart?.className).toContain("h-[220px]");
    const rechartsChart = $("[data-testid='recharts-bar-chart']");
    expect(propsOf(rechartsChart as Element).data).toEqual(data);
  });

  it("defaults to horizontal layout with category XAxis", () => {
    const { $ } = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }]}
      />,
    );
    const chart = $("[data-testid='recharts-bar-chart']");
    expect(propsOf(chart as Element).layout).toBe("horizontal");
    const xAxis = $("[data-testid='recharts-x-axis']");
    expect(propsOf(xAxis as Element).dataKey).toBe("category");
  });

  it("uses numeric XAxis and category YAxis for vertical layout", () => {
    const { $ } = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }]}
        layout="vertical"
      />,
    );
    const chart = $("[data-testid='recharts-bar-chart']");
    expect(propsOf(chart as Element).layout).toBe("vertical");
    const xAxis = $("[data-testid='recharts-x-axis']");
    expect(propsOf(xAxis as Element).type).toBe("number");
    const yAxis = $("[data-testid='recharts-y-axis']");
    expect(propsOf(yAxis as Element).dataKey).toBe("category");
    expect(propsOf(yAxis as Element).type).toBe("category");
  });

  it("renders one Bar per series with fill and radius", () => {
    const { $$ } = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }, { key: "revenue", color: "#10b981" }]}
      />,
    );
    const bars = $$("[data-testid='recharts-bar']");
    expect(bars).toHaveLength(2);
    expect(propsOf(bars[0]).fill).toBe("var(--color-count)");
    expect(propsOf(bars[0]).radius).toEqual([4, 4, 0, 0]);
    expect(propsOf(bars[1]).fill).toBe("#10b981");
  });

  it("stacks bars when stacked is true", () => {
    const { $ } = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }]}
        stacked
      />,
    );
    expect(propsOf($("[data-testid='recharts-bar']") as Element).stackId).toBe(
      "a",
    );
  });

  it("renders horizontal grid by default and vertical grid for vertical layout", () => {
    const horizontal = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }]}
      />,
    );
    const hGrid = propsOf(
      horizontal.$("[data-testid='recharts-cartesian-grid']") as Element,
    );
    expect(hGrid.vertical).toBe(false);
    expect(hGrid.horizontal).not.toBe(false);
    horizontal.unmount();

    const vertical = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }]}
        layout="vertical"
      />,
    );
    const vGrid = propsOf(
      vertical.$("[data-testid='recharts-cartesian-grid']") as Element,
    );
    expect(vGrid.vertical).not.toBe(false);
    expect(vGrid.horizontal).toBe(false);
  });

  it("hides the grid when showGrid is false", () => {
    const { $ } = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }]}
        showGrid={false}
      />,
    );
    expect(
      $("[data-testid='recharts-cartesian-grid']"),
    ).not.toBeInTheDocument();
  });

  it("renders a chart tooltip", () => {
    const { $ } = renderChart(
      <BarChartInner
        data={data}
        config={config}
        xKey="category"
        series={[{ key: "count" }]}
      />,
    );
    expect($("[data-testid='recharts-tooltip']")).toBeInTheDocument();
  });
});
