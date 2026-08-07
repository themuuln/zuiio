"use client";

import dynamic from "next/dynamic";
import type { EfficiencyChartProps } from "./efficiency-chart";

const EfficiencyChart = dynamic(
  () =>
    import("./efficiency-chart").then((m) => ({ default: m.EfficiencyChart })),
  { ssr: false },
);

/**
 * Client Component wrapper that lazy-loads EfficiencyChart (recharts-heavy) with ssr: false.
 * Required because `ssr: false` is not allowed with next/dynamic in Server Components.
 */
export function EfficiencyChartWrapper(props: EfficiencyChartProps) {
  return <EfficiencyChart {...props} />;
}

export type { EfficiencyChartProps };
