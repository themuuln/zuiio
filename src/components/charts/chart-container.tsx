"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
  children: ReactNode;
  aspect?: number;
  height?: number;
}

export function ChartContainer({
  children,
  aspect = 4 / 3,
  height,
}: ChartContainerProps) {
  if (height) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" aspect={aspect}>
      {children as React.ReactElement}
    </ResponsiveContainer>
  );
}
