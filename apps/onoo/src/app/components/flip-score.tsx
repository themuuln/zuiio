"use client";

import { cn } from "@/lib/utils";
import { FlipDigit } from "./flip-digit";

interface FlipScoreProps {
  homeScore: number;
  awayScore: number;
  className?: string;
}

function getDigits(n: number): string[] {
  return String(Math.max(0, Math.floor(n))).split("");
}

export function FlipScore({ homeScore, awayScore, className }: FlipScoreProps) {
  const homeDigits: string[] = getDigits(homeScore);
  const awayDigits: string[] = getDigits(awayScore);

  return (
    <div className={cn("flex items-center gap-2 tabular-nums", className)}>
      <div className="flex gap-0.5">
        {homeDigits.map((d, i) => (
          <FlipDigit
            key={`h-${i}`}
            digit={d}
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
            key={`a-${i}`}
            digit={d}
            className="stat-number text-4xl sm:text-6xl lg:text-7xl"
          />
        ))}
      </div>
    </div>
  );
}
