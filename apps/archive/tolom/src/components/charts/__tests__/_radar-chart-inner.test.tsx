import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RadarChartInner from "@/components/charts/_radar-chart-inner";
import type { ChartConfig } from "@/components/ui/chart";

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

const data = [
  { skill: "Brakes", score: 80 },
  { skill: "Engine", score: 90 },
];

const config: ChartConfig = {
  score: { label: "Score", color: "#3b82f6" },
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

describe("RadarChartInner", () => {
  it("renders a ChartContainer with height class and passes data", () => {
    const { $ } = renderChart(
      <RadarChartInner
        data={data}
        config={config}
        xKey="skill"
        series={[{ key: "score" }]}
        height={250}
      />,
    );
    const chart = $("[data-slot='chart']");
    expect(chart).toBeInTheDocument();
    expect(chart?.className).toContain("h-[250px]");
    expect(
      propsOf($("[data-testid='recharts-radar-chart']") as Element).data,
    ).toEqual(data);
  });

  it("renders PolarAngleAxis with the xKey and PolarRadiusAxis", () => {
    const { $ } = renderChart(
      <RadarChartInner
        data={data}
        config={config}
        xKey="skill"
        series={[{ key: "score" }]}
      />,
    );
    const angleAxis = $("[data-testid='recharts-polar-angle-axis']");
    expect(angleAxis).toBeInTheDocument();
    expect(propsOf(angleAxis as Element).dataKey).toBe("skill");
    expect($("[data-testid='recharts-polar-radius-axis']")).toBeInTheDocument();
  });

  it("renders one Radar per series with fill, opacity and stroke", () => {
    const { $$ } = renderChart(
      <RadarChartInner
        data={data}
        config={config}
        xKey="skill"
        series={[{ key: "score", color: "#10b981" }, { key: "bonus" }]}
      />,
    );
    const radars = $$("[data-testid='recharts-radar']");
    expect(radars).toHaveLength(2);
    expect(propsOf(radars[0]).fill).toBe("#10b981");
    expect(propsOf(radars[0]).fillOpacity).toBe(0.15);
    expect(propsOf(radars[0]).stroke).toBe("#10b981");
    expect(propsOf(radars[0]).strokeWidth).toBe(2);
    expect(propsOf(radars[1]).fill).toBe("var(--color-bonus)");
  });

  it("renders PolarGrid by default and hides it when showGrid is false", () => {
    const first = renderChart(
      <RadarChartInner
        data={data}
        config={config}
        xKey="skill"
        series={[{ key: "score" }]}
      />,
    );
    expect(first.$("[data-testid='recharts-polar-grid']")).toBeInTheDocument();
    first.unmount();

    const second = renderChart(
      <RadarChartInner
        data={data}
        config={config}
        xKey="skill"
        series={[{ key: "score" }]}
        showGrid={false}
      />,
    );
    expect(
      second.$("[data-testid='recharts-polar-grid']"),
    ).not.toBeInTheDocument();
  });

  it("renders a chart tooltip", () => {
    const { $ } = renderChart(
      <RadarChartInner
        data={data}
        config={config}
        xKey="skill"
        series={[{ key: "score" }]}
      />,
    );
    expect($("[data-testid='recharts-tooltip']")).toBeInTheDocument();
  });
});
