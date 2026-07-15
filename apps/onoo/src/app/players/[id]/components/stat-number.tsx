"use client";

import { useCountUp } from "@/lib/hooks/use-count-up";

interface StatNumberProps {
  value: number | null;
  label: string;
}

/**
 * Animated stat display. Shows em-dash for players with no games.
 */
export function StatNumber({ value, label }: StatNumberProps) {
  const hasData = value != null;
  const animated = useCountUp(hasData ? value : 0);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
        {hasData ? animated.toFixed(1) : "\u2013"}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
