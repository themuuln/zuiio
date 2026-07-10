"use client";

import dynamic from "next/dynamic";
// Recharts v2.x does not export *Props types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RechartsChartProps = {
  data: Record<string, unknown>[];
  children?: React.ReactNode;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  stackOffset?: "expand" | "none" | "wiggle" | "silhouette";
  layout?: "horizontal" | "vertical";
  syncId?: string;
  onClick?: (...args: unknown[]) => void;
  [key: string]: unknown;
};

/**
 * Dynamically imported chart components.
 * Recharts is ~85KB gzipped — these wrappers defer loading until
 * the chart section renders, keeping initial bundles small.
 */

export const DynamicAreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false },
) as React.ComponentType<RechartsChartProps>;

export const DynamicBarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false },
) as React.ComponentType<RechartsChartProps>;

export const DynamicLineChart = dynamic(
  () => import("recharts").then((m) => m.LineChart),
  { ssr: false },
) as React.ComponentType<RechartsChartProps>;

export const DynamicPieChart = dynamic(
  () =>
    import("recharts").then((m) => m.PieChart) as Promise<{
      default: React.ComponentType<RechartsChartProps>;
    }>,
  { ssr: false },
) as React.ComponentType<RechartsChartProps>;

export const DynamicResponsiveContainer = dynamic(
  () =>
    import("recharts").then((m) => m.ResponsiveContainer) as Promise<{
      default: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>;
    }>,
  { ssr: false },
) as React.ComponentType<React.HTMLAttributes<HTMLDivElement>>;
