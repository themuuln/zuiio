"use client";

import { cn } from "@/lib/utils";
import { FlipDigit } from "./flip-digit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoreBoardProps {
  homeScore: number;
  awayScore: number;
  /** Previous home score — seeds animation initial state */
  prevHomeScore?: number;
  /** Previous away score — seeds animation initial state */
  prevAwayScore?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDigits(n: number): string[] {
  return String(Math.max(0, Math.floor(n))).split("");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScoreBoard({
  homeScore,
  awayScore,
  prevHomeScore,
  prevAwayScore,
  className,
}: ScoreBoardProps) {
  const homeDigits = getDigits(homeScore);
  const awayDigits = getDigits(awayScore);
  const prevHomeDigits =
    prevHomeScore != null ? getDigits(prevHomeScore) : undefined;
  const prevAwayDigits =
    prevAwayScore != null ? getDigits(prevAwayScore) : undefined;

  // Build prevDigit lookup by index for each side
  const prevHomeByIndex: Record<number, string> = {};
  if (prevHomeDigits) {
    for (let i = 0; i < prevHomeDigits.length; i++) {
      prevHomeByIndex[i] = prevHomeDigits[i]!;
    }
  }
  const prevAwayByIndex: Record<number, string> = {};
  if (prevAwayDigits) {
    for (let i = 0; i < prevAwayDigits.length; i++) {
      prevAwayByIndex[i] = prevAwayDigits[i]!;
    }
  }

  return (
    <div
      className={cn("flex items-center gap-2 tabular-nums", className)}
      role="status"
      aria-label={`Оноо: ${homeScore} — ${awayScore}`}
    >
      {/* Visually hidden full score for screen readers — updates on every change */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {homeScore} — {awayScore}
      </span>

      {/* Home score digits */}
      <div className="flex gap-0.5">
        {homeDigits.map((d, i) => (
          <FlipDigit
            key={`h-${i}`}
            digit={d}
            prevDigit={prevHomeByIndex[i]}
            className="stat-number text-4xl sm:text-6xl lg:text-7xl"
          />
        ))}
      </div>

      {/* Dash separator */}
      <span className="stat-number text-4xl text-sidebar-foreground/30 sm:text-6xl lg:text-7xl">
        –
      </span>

      {/* Away score digits */}
      <div className="flex gap-0.5">
        {awayDigits.map((d, i) => (
          <FlipDigit
            key={`a-${i}`}
            digit={d}
            prevDigit={prevAwayByIndex[i]}
            className="stat-number text-4xl sm:text-6xl lg:text-7xl"
          />
        ))}
      </div>
    </div>
  );
}
