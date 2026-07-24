"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import type { TeamAdvancedStatsPerGame } from "@/app/lib/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface EfficiencyChartProps {
  games: TeamAdvancedStatsPerGame[];
  className?: string;
}

export function EfficiencyChart({ games, className }: EfficiencyChartProps) {
  const id = useId();

  if (games.length < 2) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Үзүүлэлтийн хандлага</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Хандалтыг харуулахад хамгийн багадаа 2 тоглолт шаардлагатай.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = games.map((g, i) => ({
    game: `#${i + 1}`,
    ortg: g.ortg,
    drtg: g.drtg,
    result: g.result,
    opponent: g.opponent_name,
    score: `${g.team_score}–${g.opp_score}`,
  }));

  const chartConfig = {
    ortg: {
      label: "ORtg",
      color: "var(--chart-1)",
    },
    drtg: {
      label: "DRtg",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Үзүүлэлтийн хандлага</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[var(--chart-1)]" />
              ORtg (довтолгоо)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[var(--chart-2)]" />
              DRtg (хамгаалалт)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`${id}-ortg`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id={`${id}-drtg`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-2)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-2)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="game"
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={30} />
            <ReferenceLine
              y={100}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => {
                    const metric =
                      name === "ortg"
                        ? "Довтолгооны үнэлгээ"
                        : "Хамгаалалтын үнэлгээ";
                    return `${metric}: ${(+value).toFixed(1)}`;
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(_label: any, payload: any) => {
                    const p = payload?.[0]?.payload as Record<string, unknown>;
                    return `${p.opponent as string} (${p.score as string})`;
                  }}
                />
              }
              cursor={false}
            />
            <Area
              type="monotone"
              dataKey="ortg"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill={`url(#${id}-ortg)`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="drtg"
              stroke="var(--chart-2)"
              strokeWidth={2}
              fill={`url(#${id}-drtg)`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
