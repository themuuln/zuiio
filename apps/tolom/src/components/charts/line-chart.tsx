"use client";

import dynamic from "next/dynamic";
import type { ChartConfig } from "@/components/ui/chart";

export interface LineChartProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
  xKey: string;
  series: { key: string; color?: string; dashed?: boolean }[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
}

export const LineChart = dynamic(() => import("./_line-chart-inner"), {
  ssr: false,
});
