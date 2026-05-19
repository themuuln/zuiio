"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);

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
