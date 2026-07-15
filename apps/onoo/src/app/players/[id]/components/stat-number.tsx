"use client";

import { useCountUp } from "@/lib/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface StatNumberProps {
  value: number | null;
  label: string;
  precision?: number;
  inverse?: boolean;
  className?: string;
}

/**
 * Animated stat display. Shows em-dash for players with no games.
 */
export function StatNumber({
  value,
  label,
  precision = 1,
  inverse = false,
  className,
}: StatNumberProps) {
  const hasData = value != null;
  const animated = useCountUp(hasData ? value : 0);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
        {hasData ? animated.toFixed(precision) : "\u2013"}
      </span>
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wider",
          inverse ? "text-sidebar-foreground/60" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
