"use client";

import { useCountUp } from "@/lib/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface StatNumberProps {
  value: number | null;
  label: string;
  precision?: number;
  inverse?: boolean;
  accent?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Animated stat display primitive.
 * Large, bold, tabular-nums with optional amber accent and count-up animation.
 * Shows em-dash for players with no games.
 */
export function StatNumber({
  value,
  label,
  precision = 1,
  inverse = false,
  accent = false,
  size = "md",
  className,
}: StatNumberProps) {
  const hasData = value != null;
  const animated = useCountUp(hasData ? value : 0);

  const sizeClasses = {
    sm: "text-2xl sm:text-3xl",
    md: "text-3xl sm:text-4xl",
    lg: "text-4xl sm:text-5xl",
    xl: "text-5xl sm:text-6xl",
  }[size];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={cn(
          "font-black tabular-nums leading-none tracking-tight",
          sizeClasses,
          accent ? "text-[var(--brand-sports)]" : "",
        )}
      >
        {hasData ? animated.toFixed(precision) : "–"}
      </span>
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wider",
          inverse ? "text-sidebar-foreground/60" : "text-muted-foreground",
          accent ? "text-[var(--brand-sports)]/70" : "",
        )}
      >
        {label}
      </span>
    </div>
  );
}
