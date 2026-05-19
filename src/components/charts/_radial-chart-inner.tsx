"use client";

// recharts - consider next/dynamic for code splitting
import { RadialBar, RadialBarChart as RechartsRadialBarChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { RadialChartProps } from "./radial-chart";

export default function RadialChartInner({
  data,
  config,
  dataKey = "value",
  height = 300,
  innerRadius = "30%",
  outerRadius = "100%",
  barSize = 8,
}: RadialChartProps) {
  return (
    <ChartContainer config={config} className={`mx-auto aspect-square h-[${height}px]`}>
      <RechartsRadialBarChart
        data={data}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        barSize={barSize}
        barCategoryGap={8}
        startAngle={90}
        endAngle={-270}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        {data.map((entry) => (
          <RadialBar
            key={entry.name}
            dataKey={dataKey}
            data={[entry]}
            fill={entry.fill ?? `var(--color-${entry.name.toLowerCase()})`}
            cornerRadius={barSize / 2}
            background={{ fill: "var(--color-muted)" }}
          />
        ))}
      </RechartsRadialBarChart>
    </ChartContainer>
  );
}
