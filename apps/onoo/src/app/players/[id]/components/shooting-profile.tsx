"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRAND_ACCENT = "oklch(0.78 0.16 80)";
const TRACK_COLOR = "oklch(0.92 0.005 265)";
const GAUGE_SIZE = 112;
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
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
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
          <span className="text-base font-semibold tabular-nums leading-none">
            {hasAttempts ? `${value}%` : "\u2014"}
          </span>
        </div>
      </div>

      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">
        {made}/{attempted}
      </span>
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
    { key: "2P", label: "2-оноо", points: twoP, color: "var(--color-chart-1)" },
    { key: "3P", label: "3-оноо", points: threeP, color: "var(--color-chart-2)" },
    { key: "FT", label: "Ширэнгийн", points: ft, color: "var(--color-chart-5)" },
  ].filter((s) => s.points > 0);

  return (
    <div className="space-y-2 pt-4">
      <div className="flex h-7 overflow-hidden rounded-md">
        {segments.map((seg) => (
          <div
            key={seg.key}
            style={{
              width: `${(seg.points / total) * 100}%`,
              backgroundColor: seg.color,
            }}
            className="flex items-center justify-center text-xs font-medium text-white"
          >
            {segments.length > 1 && Math.round((seg.points / total) * 100)}%
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
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

export function ShootingProfile({ data, teamColor }: ShootingProfileProps) {
  const color = teamColor ?? BRAND_ACCENT;
  const fgPct = data.fga > 0 ? (data.fgm / data.fga) * 100 : null;
  const tpPct = data.tpa > 0 ? (data.tpm / data.tpa) * 100 : null;
  const ftPct = data.fta > 0 ? (data.ftm / data.fta) * 100 : null;

  // All zeros — nothing to show
  if (data.fga === 0 && data.tpa === 0 && data.fta === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">\u041F\u04AF\u0440\u0448\u0438\u043B\u0442\u0438\u0439\u043D \u043F\u0440\u043E\u0444\u0438\u043B\u044C</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            \u0417\u043E\u0440\u0438\u043B\u043E\u043D\u044B \u043C\u044D\u0434\u044D\u044D\u043B \u0431\u0430\u0439\u0445\u0433\u04AF\u0439
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {"\u041F\u04AF\u0440\u0448\u0438\u043B\u0442\u0438\u0439\u043D \u043F\u0440\u043E\u0444\u0438\u043B\u044C"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Three gauge rings side by side */}
        <div className="flex items-start justify-center gap-6 sm:gap-10">
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
