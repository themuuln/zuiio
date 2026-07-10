/**
 * DeltaIndicator — Shows a percentage change with trend arrow.
 *
 * Reusable across any metric display (KPIs, tables, cards).
 * Green = positive (or negative when inverted), red = negative.
 */
import { TrendingDown, TrendingUp } from "lucide-react";

interface DeltaIndicatorProps {
  value: number | null;
  /** Invert colors — for metrics where down is good (e.g., expenses, defects). */
  invert?: boolean;
  /** Show % suffix. Defaults to true. */
  showPercent?: boolean;
}

export function DeltaIndicator({
  value,
  invert,
  showPercent = true,
}: DeltaIndicatorProps) {
  if (value === null || value === undefined) return null;

  const up = value > 0;
  const suffix = showPercent ? "%" : "";
  const color =
    value === 0
      ? "text-muted-foreground"
      : invert
        ? up
          ? "text-red-500"
          : "text-green-600 dark:text-green-400"
        : up
          ? "text-green-600 dark:text-green-400"
          : "text-red-500";
  const Icon = value === 0 ? null : up ? TrendingUp : TrendingDown;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}
    >
      {Icon && <Icon className="size-3" />}
      {up ? "+" : ""}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}
