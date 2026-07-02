"use client";

import { cn } from "@/lib/utils";
import { STATUS_ACCENT } from "./_constants";

interface BayCardAccentProps {
  status: string;
  /** Minutes since job started — triggers urgency when > 120 */
  elapsedMinutes?: number | null;
}

/**
 * Urgency thresholds (in minutes):
 * - > 120: Warning (amber pulse)
 * - > 180: Critical (red pulse)
 */
function getUrgencyClass(elapsed: number | null | undefined): string {
  if (elapsed == null || elapsed <= 0) return "";
  if (elapsed > 180)
    return "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)] animate-pulse";
  if (elapsed > 120)
    return "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse";
  return "";
}

export function BayCardAccent({ status, elapsedMinutes }: BayCardAccentProps) {
  const urgencyClass = getUrgencyClass(elapsedMinutes);

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 top-0 w-[4px]",
        urgencyClass || (STATUS_ACCENT[status] ?? "bg-primary"),
      )}
    />
  );
}
