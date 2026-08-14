"use client";

import { Clock, Pause } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useBayViewTick } from "./_tick-context";

function formatElapsed(minutes: number): string {
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function ElapsedText({
  startedAt,
  className,
}: {
  startedAt: string | null | undefined;
  className?: string;
}) {
  const tick = useBayViewTick();

  if (!startedAt || tick === null) {
    return <span className={className}>—</span>;
  }

  const minutes = Math.floor((tick - new Date(startedAt).getTime()) / 60000);
  const display = minutes >= 0 ? formatElapsed(minutes) : "—";

  return <span className={className}>{display}</span>;
}

export function ElapsedTimer({
  startedAt,
}: {
  startedAt: string | null | undefined;
}) {
  const tick = useBayViewTick();
  const [paused, setPaused] = useState(false);
  const pausedAtRef = useRef(0);

  if (!startedAt || tick === null) return null;

  const nowMs = new Date(startedAt).getTime();
  const elapsedMsFromStart = Math.max(0, tick - nowMs);
  // If paused, freeze at the moment it was paused
  const elapsedMs = paused ? pausedAtRef.current : elapsedMsFromStart;

  const elapsedMins = Math.floor(elapsedMs / 60_000);
  const display = formatElapsed(elapsedMins);

  const isWarning = elapsedMins > 120;
  const isCritical = elapsedMins > 180;

  // Progress: 0-4h maps to 0-100%
  const progress = Math.min((elapsedMins / 240) * 100, 100);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaused((prev) => {
      if (!prev) {
        pausedAtRef.current = elapsedMsFromStart;
      }
      return !prev;
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "relative inline-flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums select-none border transition-[color,background-color,border-color] duration-200",
        paused
          ? "bg-muted/30 text-muted-foreground/50 border-border/10"
          : isCritical
            ? "bg-destructive/10 text-destructive border-destructive/25"
            : isWarning
              ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
              : "bg-muted/60 text-muted-foreground border-border/30",
      )}
    >
      {/* Progress bar background */}
      <span
        className={cn(
          "absolute inset-y-0 left-0 -z-0 transition-[width] duration-500 ease-out-quart",
          paused
            ? "bg-muted/20"
            : isCritical
              ? "bg-destructive/8"
              : isWarning
                ? "bg-amber-500/8"
                : "bg-muted/40",
        )}
        style={{ width: `${progress}%` }}
      />
      {paused ? (
        <Pause className="relative z-10 size-3" />
      ) : (
        <Clock className="relative z-10 size-3" />
      )}
      <span className="relative z-10">{display}</span>
      {paused && (
        <span className="relative z-10 text-[10px] uppercase tracking-wider opacity-60">
          paused
        </span>
      )}
    </button>
  );
}
