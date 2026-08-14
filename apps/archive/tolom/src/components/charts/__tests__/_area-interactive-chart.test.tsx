import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AreaInteractiveChart } from "@/components/charts/_area-interactive-chart";

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

const data = [
  { date: "2026-08-01", desktop: 120, mobile: 60 },
  { date: "2026-08-02", desktop: 150, mobile: 80 },
];

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

describe("AreaInteractiveChart", () => {
  it("renders a ChartContainer with the fixed height class", () => {
    const { $ } = renderChart(<AreaInteractiveChart data={data} />);
    const chart = $("[data-slot='chart']");
    expect(chart).toBeInTheDocument();
    expect(chart?.className).toContain("h-[280px]");
  });

  it("passes the data to the recharts area chart", () => {
    const { $ } = renderChart(<AreaInteractiveChart data={data} />);
    const chart = $("[data-testid='recharts-area-chart']");
    expect(chart).toBeInTheDocument();
    expect(propsOf(chart as Element).data).toEqual(data);
  });

  it("renders an XAxis keyed on date", () => {
    const { $ } = renderChart(<AreaInteractiveChart data={data} />);
    const xAxis = $("[data-testid='recharts-x-axis']");
    expect(xAxis).toBeInTheDocument();
    expect(propsOf(xAxis as Element).dataKey).toBe("date");
  });

  it("renders a stacked area for desktop and mobile with themed strokes", () => {
    const { $$ } = renderChart(<AreaInteractiveChart data={data} />);
    const areas = $$("[data-testid='recharts-area']");
    expect(areas).toHaveLength(2);
    expect(propsOf(areas[0]).dataKey).toBe("mobile");
    expect(propsOf(areas[0]).stackId).toBe("a");
    expect(propsOf(areas[0]).stroke).toBe("var(--color-mobile)");
    expect(propsOf(areas[1]).dataKey).toBe("desktop");
    expect(propsOf(areas[1]).stroke).toBe("var(--color-desktop)");
    expect(propsOf(areas[0]).fill).toMatch(/^url\(#fillMobile\)$/);
    expect(propsOf(areas[1]).fill).toMatch(/^url\(#fillDesktop\)$/);
  });

  it("renders a CartesianGrid and a chart tooltip", () => {
    const { $ } = renderChart(<AreaInteractiveChart data={data} />);
    expect($("[data-testid='recharts-cartesian-grid']")).toBeInTheDocument();
    expect($("[data-testid='recharts-tooltip']")).toBeInTheDocument();
  });

  it("injects CSS variables for the desktop/mobile colors", () => {
    const { $ } = renderChart(<AreaInteractiveChart data={data} />);
    const css = $("style")?.textContent ?? "";
    expect(css).toContain("--color-desktop: var(--chart-1)");
    expect(css).toContain("--color-mobile: var(--chart-2)");
  });
});
