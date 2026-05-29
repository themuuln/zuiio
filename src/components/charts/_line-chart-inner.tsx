"use client";

// recharts - consider next/dynamic for code splitting
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { LineChartProps } from "./line-chart";

export default function LineChartInner({
  data,
  config,
  xKey,
  series,
  height = 300,
  showGrid = true,
  showDots = true,
}: LineChartProps) {
  return (
    <ChartContainer
      config={config}
      className={`aspect-auto h-[${height}px] w-full`}
    >
      <RechartsLineChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
      >
        {showGrid && <CartesianGrid vertical={false} />}
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={s.color ?? `var(--color-${s.key})`}
            strokeWidth={2}
            dot={
              showDots ? { fill: s.color ?? `var(--color-${s.key})` } : false
            }
            strokeDasharray={s.dashed ? "4 4" : undefined}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}
