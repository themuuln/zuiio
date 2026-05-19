"use client";

import dynamic from "next/dynamic";
import type { ChartConfig } from "@/components/ui/chart";

export interface PieChartProps {
  data: { name: string; value: number; fill?: string }[];
  config: ChartConfig;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  donut?: boolean;
}

export const PieChart = dynamic(
  () => import("./_pie-chart-inner"),
  { ssr: false },
);
