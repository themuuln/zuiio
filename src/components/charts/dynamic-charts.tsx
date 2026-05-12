"use client";

import dynamic from "next/dynamic";
// Recharts v2.x does not export *Props types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RechartsChartProps = {
  data: any[];
  children?: React.ReactNode;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  stackOffset?: "expand" | "none" | "wiggle" | "silhouette";
  layout?: "horizontal" | "vertical";
  syncId?: string;
  onClick?: (...args: any[]) => void;
  [key: string]: any;
};

/**
 * Dynamically imported chart components.
 * Recharts is ~85KB gzipped — these wrappers defer loading until
 * the chart section renders, keeping initial bundles small.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DynamicAreaChart: any = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DynamicBarChart: any = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DynamicLineChart: any = dynamic(
  () => import("recharts").then((m) => m.LineChart),
  { ssr: false },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DynamicPieChart: any = dynamic(
  () => import("recharts").then((m) => m.PieChart),
  { ssr: false },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DynamicResponsiveContainer: any = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);
