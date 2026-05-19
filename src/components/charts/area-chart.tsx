"use client";

import dynamic from "next/dynamic";
import type { ChartConfig } from "@/components/ui/chart";

export interface AreaChartProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
  xKey: string;
  series: { key: string; color?: string }[];
  height?: number;
  showGrid?: boolean;
  showYAxis?: boolean;
  stacked?: boolean;
}

export const AreaChart = dynamic(
  () => import("./_area-chart-inner"),
  { ssr: false },
);
