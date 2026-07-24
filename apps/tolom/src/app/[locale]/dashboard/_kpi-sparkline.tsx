"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

export interface SparklineProps {
  data: { value: number }[];
  color?: string;
}

export function KpiSparkline({
  data,
  color = "var(--chart-1)",
}: SparklineProps) {
  const uid = useId();
  if (data.length < 2) return null;
  const gradientId = `spl-${uid}`;
  return (
    <div className="w-full h-8">
      <ResponsiveContainer width="100%" height={32}>
        <AreaChart
          data={data}
          margin={{ top: 1, right: 1, bottom: 0, left: 1 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
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
