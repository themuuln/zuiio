"use client";

import dynamic from "next/dynamic";
import type { FourFactorsChartProps } from "./four-factors-chart";

const FourFactorsChart = dynamic(
  () =>
    import("./four-factors-chart").then((m) => ({
      default: m.FourFactorsChart,
    })),
  { ssr: false },
);

/**
 * Client Component wrapper that lazy-loads FourFactorsChart (recharts-heavy) with ssr: false.
 * Required because `ssr: false` is not allowed with next/dynamic in Server Components.
 */
export function FourFactorsChartWrapper(props: FourFactorsChartProps) {
  return <FourFactorsChart {...props} />;
}

export type { FourFactorsChartProps };
