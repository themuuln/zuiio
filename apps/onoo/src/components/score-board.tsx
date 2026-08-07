"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FlipDigitProps {
  value: string;
  prevValue?: string;
}

/**
 * A single flip-clock digit column.
 * Animates via CSS keyframes when value changes.
 */
export function FlipDigit({ value, prevValue }: FlipDigitProps) {
  const [animating, setAnimating] = useState(false);
  const lockRef = useRef(false);
  const prevRef = useRef(prevValue);

  useEffect(() => {
    if (
      prevRef.current !== undefined &&
      prevRef.current !== value &&
      !lockRef.current
    ) {
      lockRef.current = true;
      setAnimating(true);
      const timer = setTimeout(() => {
        setAnimating(false);
        lockRef.current = false;
      }, 600);
      return () => clearTimeout(timer);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <span
      className={cn(
        "relative inline-flex h-[1em] w-[0.6em] overflow-hidden",
        "font-mono tabular-nums leading-none",
      )}
    >
      {/* Static digit (before animation settles) */}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          animating && "opacity-0",
        )}
      >
        {value}
      </span>

      {/* Animated top half — flips in from above */}
      {animating && (
        <span className="flip-digit-top absolute inset-0 flex items-center justify-center">
          {value}
        </span>
      )}

      {/* Animated bottom half — flips in to settle */}
      {animating && (
        <span className="flip-digit-bottom absolute inset-0 flex items-center justify-center">
          {value}
        </span>
      )}
    </span>
  );
}

interface ScoreBoardProps {
  homeScore: number;
  awayScore: number;
  homeLabel?: string;
  awayLabel?: string;
  className?: string;
}

/**
 * Flip-clock scoreboard for live game display.
 * Splits scores into individual digit columns with flip animation.
 */
export function ScoreBoard({
  homeScore,
  awayScore,
  homeLabel = "Эхний",
  awayLabel = "Зочин",
  className,
}: ScoreBoardProps) {
  const homeStr = String(homeScore);
  const awayStr = String(awayScore);
  const maxLen = Math.max(homeStr.length, awayStr.length, 2);
  const homePadded = homeStr.padStart(maxLen, "\u00A0");
  const awayPadded = awayStr.padStart(maxLen, "\u00A0");

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Home */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-0.5 text-3xl font-bold tabular-nums">
          {homePadded.split("").map((digit, i) => (
            <FlipDigit
              // biome-ignore lint/suspicious/noArrayIndexKey: digit columns are position-keyed for flip animation
              key={`home-${i}`}
              value={digit}
              prevValue={i < homeStr.length ? homeStr[i] : undefined}
            />
          ))}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{homeLabel}</div>
      </div>

      {/* VS */}
      <div className="text-center">
        <div className="text-lg font-semibold text-muted-foreground">:</div>
        <div className="text-xs text-muted-foreground/60">VS</div>
      </div>

      {/* Away */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-0.5 text-3xl font-bold tabular-nums">
          {awayPadded.split("").map((digit, i) => (
            <FlipDigit
              // biome-ignore lint/suspicious/noArrayIndexKey: digit columns are position-keyed for flip animation
              key={`away-${i}`}
              value={digit}
              prevValue={i < awayStr.length ? awayStr[i] : undefined}
            />
          ))}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{awayLabel}</div>
      </div>
    </div>
  );
}
