"use client";

import { useId } from "react";
// recharts - consider next/dynamic for code splitting
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { AreaChartProps } from "./area-chart";

export default function AreaChartInner({
  data,
  config,
  xKey,
  series,
  height = 300,
  showGrid = true,
  showYAxis = false,
  stacked = false,
}: AreaChartProps) {
  const id = useId();

  return (
    <ChartContainer config={config} className={`aspect-auto h-[${height}px] w-full`}>
      <RechartsAreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        {showGrid && <CartesianGrid vertical={false} />}
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: string) => v?.slice(0, 3) ?? v}
        />
        {showYAxis && (
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        )}
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        {series.map((s) => (
          <defs key={s.key}>
            <linearGradient id={`fill${s.key}${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color ?? "var(--color-foreground)"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={s.color ?? "var(--color-foreground)"} stopOpacity={0.05} />
            </linearGradient>
          </defs>
        ))}
        {series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type="natural"
            fill={`url(#fill${s.key}${id})`}
            stroke={s.color ?? `var(--color-${s.key})`}
            stackId={stacked ? "a" : undefined}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  );
}
