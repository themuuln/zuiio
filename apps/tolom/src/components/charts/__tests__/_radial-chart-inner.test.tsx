import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RadialChartInner from "@/components/charts/_radial-chart-inner";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

const data = [
  { name: "completed", value: 60 },
  { name: "pending", value: 40, fill: "#10b981" },
];

const config: ChartConfig = {
  completed: { label: "Completed", color: "#3b82f6" },
  pending: { label: "Pending", color: "#10b981" },
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

describe("RadialChartInner", () => {
  it("renders a ChartContainer with height class", () => {
    const { $ } = renderChart(
      <RadialChartInner data={data} config={config} height={200} />,
    );
    const chart = $("[data-slot='chart']");
    expect(chart).toBeInTheDocument();
    expect(chart?.className).toContain("h-[200px]");
  });

  it("passes data and default radius/angle props to the radial bar chart", () => {
    const { $ } = renderChart(<RadialChartInner data={data} config={config} />);
    const chart = $("[data-testid='recharts-radial-bar-chart']");
    expect(chart).toBeInTheDocument();
    const props = propsOf(chart as Element);
    expect(props.data).toEqual(data);
    expect(props.innerRadius).toBe("30%");
    expect(props.outerRadius).toBe("100%");
    expect(props.barSize).toBe(8);
    expect(props.startAngle).toBe(90);
    expect(props.endAngle).toBe(-270);
  });

  it("renders one RadialBar per data entry with fill resolution", () => {
    const { $$ } = renderChart(
      <RadialChartInner data={data} config={config} />,
    );
    const bars = $$("[data-testid='recharts-radial-bar']");
    expect(bars).toHaveLength(2);
    // entry without fill falls back to the themed CSS var
    expect(propsOf(bars[0]).fill).toBe("var(--color-completed)");
    // explicit fill wins
    expect(propsOf(bars[1]).fill).toBe("#10b981");
    expect(propsOf(bars[0]).cornerRadius).toBe(4);
    expect(propsOf(bars[0]).background).toEqual({ fill: "var(--color-muted)" });
  });

  it("uses the provided dataKey", () => {
    const { $ } = renderChart(
      <RadialChartInner data={data} config={config} dataKey="score" />,
    );
    expect(
      propsOf($("[data-testid='recharts-radial-bar']") as Element).dataKey,
    ).toBe("score");
  });

  it("honors custom radius and bar size props", () => {
    const { $ } = renderChart(
      <RadialChartInner
        data={data}
        config={config}
        innerRadius="40%"
        outerRadius="90%"
        barSize={12}
      />,
    );
    const props = propsOf(
      $("[data-testid='recharts-radial-bar-chart']") as Element,
    );
    expect(props.innerRadius).toBe("40%");
    expect(props.outerRadius).toBe("90%");
    expect(props.barSize).toBe(12);
  });

  it("renders a chart tooltip", () => {
    const { $ } = renderChart(<RadialChartInner data={data} config={config} />);
    expect($("[data-testid='recharts-tooltip']")).toBeInTheDocument();
  });
});
