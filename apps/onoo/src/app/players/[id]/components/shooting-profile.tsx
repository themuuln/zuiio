"use client";

import { Target } from "lucide-react";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShootingData {
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
}

interface ShootingProfileProps {
  data: ShootingData;
  teamColor?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRAND_ACCENT = "var(--brand-sports)";
const TRACK_COLOR = "var(--color-sidebar-accent)";
const GAUGE_SIZE = 96;
const ARC_START = 225;
const ARC_END = -45;

// ---------------------------------------------------------------------------
// Gauge ring — single RadialBarChart with center text overlay
// ---------------------------------------------------------------------------

function GaugeRing({
  percentage,
  label,
  made,
  attempted,
  color,
}: {
  percentage: number | null;
  label: string;
  made: number;
  attempted: number;
  color: string;
}) {
  const hasAttempts = attempted > 0;
  const value = hasAttempts ? Math.round(percentage ?? 0) : 0;
  const chartData = [{ value, fill: color }];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-full max-w-24 aspect-square">
        <RadialBarChart
          width={GAUGE_SIZE}
          height={GAUGE_SIZE}
          innerRadius="68%"
          outerRadius="100%"
          startAngle={ARC_START}
          endAngle={ARC_END}
          data={chartData}
          barSize={10}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <RadialBar
            dataKey="value"
            cornerRadius={5}
            background={{ fill: TRACK_COLOR }}
          />
        </RadialBarChart>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black tabular-nums leading-none">
            {hasAttempts ? `${value}%` : "—"}
          </span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
          {label}
        </span>
        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
          {made}/{attempted}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Points breakdown — horizontal stacked bar
// ---------------------------------------------------------------------------

function PointsBreakdown({
  fgm,
  tpm,
  ftm,
}: {
  fgm: number;
  tpm: number;
  ftm: number;
}) {
  const twoP = Math.max(0, fgm - tpm) * 2;
  const threeP = tpm * 3;
  const ft = ftm;
  const total = twoP + threeP + ft;

  if (total === 0) return null;

  const segments = [
    {
      key: "2P",
      label: "2-оноо",
      points: twoP,
      color: "var(--color-chart-1)",
    },
    {
      key: "3P",
      label: "3-оноо",
      points: threeP,
      color: "var(--color-chart-2)",
    },
    {
      key: "FT",
      label: "Ширэнгийн",
      points: ft,
      color: "var(--color-chart-5)",
    },
  ].filter((s) => s.points > 0);

  return (
    <div className="space-y-3 pt-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {"Онооны бүтцэл"}
      </p>
      <div
        className="flex h-3 overflow-hidden rounded-full"
        role="img"
        aria-label="Онооны бүтцэлын харьца"
      >
        {segments.map((seg) => (
          <div
            key={seg.key}
            style={{
              width: `${(seg.points / total) * 100}%`,
              backgroundColor: seg.color,
            }}
            className="h-full transition-[width] duration-500 ease-[var(--ease-sport)]"
            title={`${seg.label}: ${Math.round((seg.points / total) * 100)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            {seg.label} ({seg.points})
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShootingProfile({
  data,
  teamColor,
  className,
}: ShootingProfileProps) {
  const color = teamColor ?? BRAND_ACCENT;
  const fgPct = data.fga > 0 ? (data.fgm / data.fga) * 100 : null;
  const tpPct = data.tpa > 0 ? (data.tpm / data.tpa) * 100 : null;
  const ftPct = data.fta > 0 ? (data.ftm / data.fta) * 100 : null;

  // All zeros — nothing to show
  if (data.fga === 0 && data.tpa === 0 && data.fta === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{"Пүршилтийн профиль"}</CardTitle>
          <CardDescription>
            {"Орололт, гурвалжин, шийдлийн нарийвчлал"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-52 flex-col items-center justify-center text-center">
            <Target
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 font-semibold">
              {"Шидэлтийн мэдээл хараахан алга"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {"Баталгаажсан оролдлогын дараа харьца энд гарна."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{"Пүршилтийн профиль"}</CardTitle>
        <CardDescription>
          {"Орололт, гурвалжин, шийдлийн нарийвчлал"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Three gauge rings side by side */}
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          <GaugeRing
            percentage={fgPct}
            label="FG%"
            made={data.fgm}
            attempted={data.fga}
            color={color}
          />
          <GaugeRing
            percentage={tpPct}
            label="3P%"
            made={data.tpm}
            attempted={data.tpa}
            color={color}
          />
          <GaugeRing
            percentage={ftPct}
            label="FT%"
            made={data.ftm}
            attempted={data.fta}
            color={color}
          />
        </div>

        {/* Points breakdown bar */}
        <PointsBreakdown fgm={data.fgm} tpm={data.tpm} ftm={data.ftm} />
      </CardContent>
    </Card>
  );
}
