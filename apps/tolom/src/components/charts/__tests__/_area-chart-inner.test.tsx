import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AreaChartInner from "@/components/charts/_area-chart-inner";
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

describe("AreaChartInner", () => {
  it("renders a ChartContainer with the default height class", () => {
    const { $ } = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    const chart = $("[data-slot='chart']");
    expect(chart).toBeInTheDocument();
    expect(chart?.className).toContain("h-[300px]");
  });

  it("applies the custom height class", () => {
    const { $ } = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
        height={240}
      />,
    );
    expect($("[data-slot='chart']")?.className).toContain("h-[240px]");
  });

  it("passes data to the recharts area chart", () => {
    const { $ } = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    const chart = $("[data-testid='recharts-area-chart']");
    expect(chart).toBeInTheDocument();
    expect(propsOf(chart as Element).data).toEqual(data);
  });

  it("renders XAxis with the xKey dataKey and a slicing tick formatter", () => {
    const { $ } = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    const xAxis = $("[data-testid='recharts-x-axis']");
    expect(xAxis).toBeInTheDocument();
    expect(propsOf(xAxis as Element).dataKey).toBe("month");
    // tickFormatter must be present (functions are stripped from JSON props)
    expect(xAxis?.textContent).toBe("");
  });

  it("hides YAxis by default and shows it when showYAxis is true", () => {
    const first = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    expect(first.$("[data-testid='recharts-y-axis']")).not.toBeInTheDocument();

    const second = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
        showYAxis
      />,
    );
    expect(second.$("[data-testid='recharts-y-axis']")).toBeInTheDocument();
  });

  it("renders one gradient defs block and one Area per series", () => {
    const { $$ } = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }, { key: "count", color: "#10b981" }]}
      />,
    );
    const areas = $$("[data-testid='recharts-area']");
    expect(areas).toHaveLength(2);
    // gradient ids reference the series keys
    expect(propsOf(areas[0]).fill).toMatch(/^url\(#fillrevenue.+\)$/);
    expect(propsOf(areas[0]).stroke).toBe("var(--color-revenue)");
    expect(propsOf(areas[1]).stroke).toBe("#10b981");
  });

  it("adds a stackId when stacked is true", () => {
    const { $ } = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
        stacked
      />,
    );
    expect(propsOf($("[data-testid='recharts-area']") as Element).stackId).toBe(
      "a",
    );
  });

  it("leaves stackId unset when stacked is false", () => {
    const { $ } = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    expect(
      propsOf($("[data-testid='recharts-area']") as Element).stackId,
    ).toBeUndefined();
  });

  it("renders CartesianGrid by default and hides it when showGrid is false", () => {
    const first = renderChart(
      <AreaChartInner
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
      <AreaChartInner
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

  it("renders a chart tooltip with dot indicator", () => {
    const { $ } = renderChart(
      <AreaChartInner
        data={data}
        config={config}
        xKey="month"
        series={[{ key: "revenue" }]}
      />,
    );
    expect($("[data-testid='recharts-tooltip']")).toBeInTheDocument();
  });
});
