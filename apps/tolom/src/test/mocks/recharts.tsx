import type * as React from "react";

/**
 * Minimal recharts mock for jsdom component tests.
 *
 * Real recharts measures container size via ResizeObserver and renders
 * 0x0 (no SVG, no ticks) in jsdom, so chart tests use this lightweight
 * stand-in: chart/axis/series components render as DOM nodes carrying
 * their props as JSON (`data-props`) plus `data-testid`, which lets tests
 * assert data flow, series config, stacking, colors, etc. without SVG.
 *
 * Usage:
 *   vi.mock("recharts", async () => await import("@/test/mocks/recharts"));
 *
 * Components that render children (charts, Tooltip, Legend,
 * ResponsiveContainer) keep them mounted so the real
 * ChartTooltipContent / ChartLegendContent still render inside
 * ChartContainer's context.
 */

type MockProps = Record<string, unknown> & { children?: React.ReactNode };

function safeJson(value: unknown): string {
  // React 19 elements carry circular `_owner` fiber references and DOM
  // nodes expose `__reactContainer$` back-references — drop revisited
  // objects so JSON.stringify never throws on a cycle.
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, v) => {
    if (typeof v === "function") return undefined;
    if (v !== null && typeof v === "object") {
      if (seen.has(v)) return undefined;
      seen.add(v);
    }
    return v;
  });
}

function makeChartComponent(testId: string) {
  return function ChartMock(props: MockProps) {
    const { children, ...rest } = props;
    return (
      <div data-testid={testId} data-props={safeJson(rest)}>
        {children}
      </div>
    );
  };
}

function makeSeriesComponent(testId: string) {
  return function SeriesMock(props: MockProps) {
    const { children, ...rest } = props;
    return (
      <span data-testid={testId} data-props={safeJson(rest)}>
        {children}
      </span>
    );
  };
}

export const AreaChart = makeChartComponent("recharts-area-chart");
export const BarChart = makeChartComponent("recharts-bar-chart");
export const LineChart = makeChartComponent("recharts-line-chart");
export const PieChart = makeChartComponent("recharts-pie-chart");
export const RadarChart = makeChartComponent("recharts-radar-chart");
export const RadialBarChart = makeChartComponent("recharts-radial-bar-chart");

export const Area = makeSeriesComponent("recharts-area");
export const Bar = makeSeriesComponent("recharts-bar");
export const CartesianGrid = makeSeriesComponent("recharts-cartesian-grid");
export const LabelList = makeSeriesComponent("recharts-label-list");
export const Legend = makeChartComponent("recharts-legend");
export const Line = makeSeriesComponent("recharts-line");
export const Pie = makeSeriesComponent("recharts-pie");
export const PolarAngleAxis = makeSeriesComponent("recharts-polar-angle-axis");
export const PolarGrid = makeSeriesComponent("recharts-polar-grid");
export const PolarRadiusAxis = makeSeriesComponent(
  "recharts-polar-radius-axis",
);
export const Radar = makeSeriesComponent("recharts-radar");
export const RadialBar = makeSeriesComponent("recharts-radial-bar");
export const Tooltip = makeChartComponent("recharts-tooltip");
export const XAxis = makeSeriesComponent("recharts-x-axis");
export const YAxis = makeSeriesComponent("recharts-y-axis");

export function ResponsiveContainer(props: MockProps) {
  const { children, ...rest } = props;
  return (
    <div
      data-testid="recharts-responsive-container"
      data-props={safeJson(rest)}
    >
      {children}
    </div>
  );
}
