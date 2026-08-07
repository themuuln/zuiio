"use client";

import { cn } from "@/lib/utils";
import { FlipDigit } from "./flip-digit";

interface FlipScoreProps {
  homeScore: number;
  awayScore: number;
  className?: string;
}

function getDigits(n: number): number[] {
  if (n < 10) return [n];
  return String(n).split("").map(Number);
}

export function FlipScore({ homeScore, awayScore, className }: FlipScoreProps) {
  const homeDigits = getDigits(homeScore);
  const awayDigits = getDigits(awayScore);

  return (
    <div className={cn("flex items-center gap-2 tabular-nums", className)}>
      <div className="flex gap-0.5">
        {homeDigits.map((d, i) => (
          <FlipDigit
            // biome-ignore lint/suspicious/noArrayIndexKey: digit position is the stable identity for the flip animation
            key={`h-${i}`}
            value={d}
            className="stat-number text-4xl sm:text-6xl lg:text-7xl"
          />
        ))}
      </div>
      <span className="stat-number text-4xl text-sidebar-foreground/30 sm:text-6xl lg:text-7xl">
        –
      </span>
      <div className="flex gap-0.5">
        {awayDigits.map((d, i) => (
          <FlipDigit
            // biome-ignore lint/suspicious/noArrayIndexKey: digit position is the stable identity for the flip animation
            key={`a-${i}`}
            value={d}
            className="stat-number text-4xl sm:text-6xl lg:text-7xl"
          />
        ))}
      </div>
    </div>
  );
}
