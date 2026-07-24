"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyStatRow } from "@/app/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface MonthlyProgressionProps {
  monthlyStats: MonthlyStatRow[];
  className?: string;
}

interface StatOption {
  key: keyof MonthlyStatRow;
  label: string;
  format: (v: number) => string;
  suffix?: string;
  color: string;
}

const STAT_OPTIONS: StatOption[] = [
  {
    key: "avgPts",
    label: "Оноо",
    format: (v) => v.toFixed(1),
    color: "var(--chart-1)",
  },
  {
    key: "avgReb",
    label: "Самбар",
    format: (v) => v.toFixed(1),
    color: "var(--chart-2)",
  },
  {
    key: "avgAst",
    label: "Дамжуулалт",
    format: (v) => v.toFixed(1),
    color: "var(--chart-3)",
  },
  {
    key: "avgEff",
    label: "EFF",
    format: (v) => v.toFixed(1),
    color: "var(--chart-4)",
  },
  {
    key: "fgp",
    label: "FG%",
    format: (v) => v.toFixed(1),
    suffix: "%",
    color: "var(--chart-5)",
  },
  {
    key: "tpp",
    label: "3P%",
    format: (v) => v.toFixed(1),
    suffix: "%",
    color: "var(--chart-6)",
  },
  {
    key: "avgMpg",
    label: "Тоглосон минут",
    format: (v) => v.toFixed(1),
    color: "var(--chart-7)",
  },
  {
    key: "avgTov",
    label: "Алдаа",
    format: (v) => v.toFixed(1),
    color: "var(--chart-8)",
  },
];

type TooltipPayloadEntry = { payload: Record<string, unknown> };

export function MonthlyProgression({
  monthlyStats,
  className,
}: MonthlyProgressionProps) {
  const [selectedStat, setSelectedStat] = useState("avgPts");

  if (monthlyStats.length < 2) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Сарын дундаж үзүүлэлт</CardTitle>
          <CardDescription>
            Хандлага харуулахад хамгийн багадаа 2 сарын өгөгдөл шаардлагатай.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentStat = STAT_OPTIONS.find((s) => s.key === selectedStat)!;
  const hasNull = monthlyStats.some(
    (m) => m[currentStat.key as keyof MonthlyStatRow] === null,
  );

  const chartData = monthlyStats.map((m) => ({
    month: m.monthLabel.replace(/^\d{4} оны /, ""),
    value: (m[currentStat.key as keyof MonthlyStatRow] as number) ?? 0,
    games: m.gamesPlayed,
    fullLabel: m.monthLabel,
  }));

  const chartConfig = {
    value: {
      label: currentStat.label,
      color: currentStat.color,
    },
  } satisfies ChartConfig;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Сарын дундаж үзүүлэлт</CardTitle>
            <CardDescription>
              Сар бүрийн дундаж үзүүлэлтийн хандлага
            </CardDescription>
          </div>
        </div>
        <Tabs
          value={selectedStat}
          onValueChange={setSelectedStat}
          className="mt-2"
        >
          <TabsList className="flex-wrap">
            {STAT_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.key} value={opt.key} className="text-xs">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          {hasNull ? (
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={30}
                domain={["dataMin - 2", "dataMax + 2"]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(
                      value: unknown,
                      _name: unknown,
                      item: unknown,
                    ) => {
                      const p = (item as TooltipPayloadEntry)?.payload ?? {};
                      return `${currentStat.label}: ${String(p.value ?? "")}${currentStat.suffix ?? ""}`;
                    }}
                    labelFormatter={(_label: unknown, payload: unknown) => {
                      const arr = payload as TooltipPayloadEntry[] | undefined;
                      const p = arr?.[0]?.payload ?? {};
                      return `${String(p.fullLabel ?? "")} (${String(p.games ?? "?")} тоглолт)`;
                    }}
                  />
                }
                cursor={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentStat.color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: "var(--color-background)" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
              barGap={2}
              barCategoryGap="20%"
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={30}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(
                      value: unknown,
                      _name: unknown,
                      item: unknown,
                    ) => {
                      const p = (item as TooltipPayloadEntry)?.payload ?? {};
                      return `${currentStat.label}: ${String(p.value ?? "")}${currentStat.suffix ?? ""}`;
                    }}
                    labelFormatter={(_label: unknown, payload: unknown) => {
                      const arr = payload as TooltipPayloadEntry[] | undefined;
                      const p = arr?.[0]?.payload ?? {};
                      return `${String(p.fullLabel ?? "")} (${String(p.games ?? "?")} тоглолт)`;
                    }}
                  />
                }
                cursor={false}
              />
              <Bar
                dataKey="value"
                fill={currentStat.color}
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          )}
        </ChartContainer>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {STAT_OPTIONS.map((opt, i) => (
            <span key={opt.key} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="mx-2">·</span>}
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              {opt.label}
            </span>
          ))}
        </p>
      </CardContent>
    </Card>
  );
}
