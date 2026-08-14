"use client";

// recharts - consider next/dynamic for code splitting
import { LabelList, Pie, PieChart as RechartsPieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PieChartProps } from "./pie-chart";

export default function PieChartInner({
  data,
  config,
  dataKey = "value",
  nameKey = "name",
  height = 300,
  innerRadius,
  outerRadius = 100,
  showLabels = false,
  donut = false,
}: PieChartProps) {
  const ir = innerRadius ?? (donut ? 60 : 0);

  return (
    <ChartContainer
      config={config}
      className={`mx-auto aspect-square h-[${height}px]`}
    >
      <RechartsPieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius={ir}
          outerRadius={outerRadius}
          strokeWidth={2}
          paddingAngle={2}
        >
          {showLabels && (
            <LabelList
              dataKey={nameKey}
              className="fill-foreground"
              stroke="none"
              fontSize={12}
            />
          )}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
}
