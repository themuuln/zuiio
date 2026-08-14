"use client";

import dynamic from "next/dynamic";
import type { ChartConfig } from "@/components/ui/chart";

export interface BarChartProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
  xKey: string;
  series: { key: string; color?: string }[];
  height?: number;
  showGrid?: boolean;
  stacked?: boolean;
  layout?: "horizontal" | "vertical";
}

export const BarChart = dynamic(() => import("./_bar-chart-inner"), {
  ssr: false,
});
