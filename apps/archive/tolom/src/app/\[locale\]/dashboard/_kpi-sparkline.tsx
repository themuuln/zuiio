"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

/**
 * Ultra-compact sparkline trend chart for KPI cards.
 */

export interface SparklineProps {
  data: { value: number }[];
  color?: string;
  height?: number;
}

export function KpiSparkline({
  data,
  color = "var(--chart-1)",
  height = 48,
}: SparklineProps) {
  if (data.length < 2) return null;

  const gradientId = `kpi-fill-${color.replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" hide />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
