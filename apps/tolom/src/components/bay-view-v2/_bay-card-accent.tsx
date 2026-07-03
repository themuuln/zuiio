"use client";

import { cn } from "@/lib/utils";
import { STATUS_ACCENT, URGENCY_CRITICAL, URGENCY_WARNING } from "./_constants";

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
  if (elapsed > 180) return `${URGENCY_CRITICAL} animate-pulse`;
  if (elapsed > 120) return `${URGENCY_WARNING} animate-pulse`;
  return "";
}

export function BayCardAccent({ status, elapsedMinutes }: BayCardAccentProps) {
  const urgencyClass = getUrgencyClass(elapsedMinutes);

  return (
    <div
      className={cn(
        "h-1 w-full shrink-0 rounded-t-xl",
      )}
    />
  );
}
