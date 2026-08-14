import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PieChartInner from "@/components/charts/_pie-chart-inner";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

const data = [
  { name: "Oil", value: 45 },
  { name: "Brakes", value: 30 },
];

const config: ChartConfig = {
  value: { label: "Value", color: "#3b82f6" },
};

function renderChart(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

function propsOf(el: Element): Record<string, unknown> {
  return JSON.parse(el.getAttribute("data-props") ?? "{}");
}

describe("PieChartInner", () => {
  it("renders a ChartContainer with height class", () => {
    const { $ } = renderChart(
      <PieChartInner data={data} config={config} height={240} />,
    );
    const chart = $("[data-slot='chart']");
    expect(chart).toBeInTheDocument();
    expect(chart?.className).toContain("h-[240px]");
  });

  it("defaults height to 300", () => {
    const { $ } = renderChart(<PieChartInner data={data} config={config} />);
    expect($("[data-slot='chart']")?.className).toContain("h-[300px]");
  });

  it("passes data, dataKey and nameKey to the Pie", () => {
    const { $ } = renderChart(
      <PieChartInner
        data={data}
        config={config}
        dataKey="value"
        nameKey="name"
      />,
    );
    const pie = $("[data-testid='recharts-pie']");
    expect(pie).toBeInTheDocument();
    const props = propsOf(pie as Element);
    expect(props.data).toEqual(data);
    expect(props.dataKey).toBe("value");
    expect(props.nameKey).toBe("name");
  });

  it("uses default dataKey value and nameKey name", () => {
    const { $ } = renderChart(<PieChartInner data={data} config={config} />);
    const props = propsOf($("[data-testid='recharts-pie']") as Element);
    expect(props.dataKey).toBe("value");
    expect(props.nameKey).toBe("name");
  });

  it("renders a solid pie by default and a donut when donut is true", () => {
    const solid = renderChart(<PieChartInner data={data} config={config} />);
    expect(
      propsOf(solid.$("[data-testid='recharts-pie']") as Element).innerRadius,
    ).toBe(0);
    solid.unmount();

    const donut = renderChart(
      <PieChartInner data={data} config={config} donut />,
    );
    expect(
      propsOf(donut.$("[data-testid='recharts-pie']") as Element).innerRadius,
    ).toBe(60);
  });

  it("honors an explicit innerRadius prop", () => {
    const { $ } = renderChart(
      <PieChartInner data={data} config={config} innerRadius={80} />,
    );
    expect(
      propsOf($("[data-testid='recharts-pie']") as Element).innerRadius,
    ).toBe(80);
  });

  it("renders LabelList only when showLabels is true", () => {
    const hidden = renderChart(<PieChartInner data={data} config={config} />);
    expect(
      hidden.$("[data-testid='recharts-label-list']"),
    ).not.toBeInTheDocument();

    const shown = renderChart(
      <PieChartInner data={data} config={config} showLabels />,
    );
    const labelList = shown.$("[data-testid='recharts-label-list']");
    expect(labelList).toBeInTheDocument();
    expect(propsOf(labelList as Element).dataKey).toBe("name");
  });

  it("renders a chart tooltip", () => {
    const { $ } = renderChart(<PieChartInner data={data} config={config} />);
    expect($("[data-testid='recharts-tooltip']")).toBeInTheDocument();
  });
});
