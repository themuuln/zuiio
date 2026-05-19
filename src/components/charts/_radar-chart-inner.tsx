"use client";

// recharts - consider next/dynamic for code splitting
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { RadarChartProps } from "./radar-chart";

export default function RadarChartInner({
  data,
  config,
  xKey,
  series,
  height = 300,
  showGrid = true,
}: RadarChartProps) {
  return (
    <ChartContainer config={config} className={`mx-auto aspect-square h-[${height}px]`}>
      <RechartsRadarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        {showGrid && <PolarGrid />}
        <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={90} tick={false} axisLine={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        {series.map((s) => (
          <Radar
            key={s.key}
            dataKey={s.key}
            fill={s.color ?? `var(--color-${s.key})`}
            fillOpacity={0.15}
            stroke={s.color ?? `var(--color-${s.key})`}
            strokeWidth={2}
          />
        ))}
      </RechartsRadarChart>
    </ChartContainer>
  );
}
