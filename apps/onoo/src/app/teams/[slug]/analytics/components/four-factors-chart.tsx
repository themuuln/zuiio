"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { TeamSeasonAggregates } from "@/app/lib/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface FourFactorsChartProps {
  aggregates: TeamSeasonAggregates;
  /** Optional — without league average we just show team bars */
  leagueAverages?: {
    efg: number;
    tovPct: number;
    orebPct: number;
    ftaRate: number;
  };
  className?: string;
}

const FACTOR_LABELS: Record<string, { label: string; desc: string }> = {
  efg: { label: "eFG%", desc: "Үр дүнтэй шидэлт" },
  tovPct: { label: "TOV%", desc: "Алдааны хувь" },
  orebPct: { label: "OREB%", desc: "Довтолгооны самбар" },
  ftaRate: { label: "FTA Rate", desc: "Чөлөөт шидэлтийн хувь" },
};

export function FourFactorsChart({
  aggregates,
  leagueAverages,
  className,
}: FourFactorsChartProps) {
  if (aggregates.games_played === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Тоглолтын дөрвөн хүчин зүйл</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Өгөгдөл бэлэн болоогүй байна.
          </p>
        </CardContent>
      </Card>
    );
  }

  const factors = [
    {
      key: "efg",
      value: aggregates.avg_efg,
      league: leagueAverages?.efg ?? null,
    },
    {
      key: "tovPct",
      value: aggregates.avg_tov_pct,
      league: leagueAverages?.tovPct ?? null,
    },
    {
      key: "orebPct",
      value: aggregates.avg_oreb_pct,
      league: leagueAverages?.orebPct ?? null,
    },
    {
      key: "ftaRate",
      value: aggregates.avg_fta_rate,
      league: leagueAverages?.ftaRate ?? null,
    },
  ];

  const chartData = factors.map((f) => {
    const meta = FACTOR_LABELS[f.key]!;
    return {
      factor: meta.label,
      desc: meta.desc,
      team: Math.round(f.value * 10) / 10,
      league: f.league !== null ? Math.round(f.league * 10) / 10 : null,
    };
  });

  const chartConfig = {
    team: {
      label: "Багийн",
      color: "var(--chart-1)",
    },
    league: {
      label: "Лигийн дундаж",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Тоглолтын дөрвөн хүчин зүйл</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            barGap={2}
            barCategoryGap="20%"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="factor"
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={30} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, _name: any, item: any) => {
                    const p = item.payload as Record<string, unknown>;
                    return `${p.desc as string}: ${+value.toFixed(1)}%`;
                  }}
                />
              }
              cursor={false}
            />
            <Bar
              dataKey="team"
              fill="var(--chart-1)"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
            {leagueAverages && (
              <Bar
                dataKey="league"
                fill="var(--chart-2)"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
                opacity={0.6}
              />
            )}
          </BarChart>
        </ChartContainer>

        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[var(--chart-1)]" />
            Багийн
          </span>
          {leagueAverages && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[var(--chart-2)]" />
              Лигийн дундаж
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
