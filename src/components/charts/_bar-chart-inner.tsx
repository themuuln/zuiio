"use client";

// recharts - consider next/dynamic for code splitting
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { BarChartProps } from "./bar-chart";

export default function BarChartInner({
  data,
  config,
  xKey,
  series,
  height = 300,
  showGrid = true,
  stacked = false,
  layout = "horizontal",
}: BarChartProps) {
  return (
    <ChartContainer
      config={config}
      className={`aspect-auto h-[${height}px] w-full`}
    >
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        barCategoryGap={8}
        barGap={2}
      >
        {showGrid && (
          <CartesianGrid
            vertical={layout === "vertical"}
            horizontal={layout !== "vertical"}
          />
        )}
        {layout === "horizontal" ? (
          <>
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              dataKey={xKey}
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
          </>
        )}
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={s.color ?? `var(--color-${s.key})`}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? "a" : undefined}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}
