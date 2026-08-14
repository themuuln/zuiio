"use client";

import dynamic from "next/dynamic";
import type { ChartConfig } from "@/components/ui/chart";

export interface RadarChartProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
  xKey: string;
  series: { key: string; color?: string }[];
  height?: number;
  showGrid?: boolean;
}

export const RadarChart = dynamic(() => import("./_radar-chart-inner"), {
  ssr: false,
});
