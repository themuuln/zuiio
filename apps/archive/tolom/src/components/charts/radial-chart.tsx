"use client";

import dynamic from "next/dynamic";
import type { ChartConfig } from "@/components/ui/chart";

export interface RadialChartProps {
  data: { name: string; value: number; fill?: string }[];
  config: ChartConfig;
  dataKey?: string;
  height?: number;
  innerRadius?: string;
  outerRadius?: string;
  barSize?: number;
}

export const RadialChart = dynamic(() => import("./_radial-chart-inner"), {
  ssr: false,
});
