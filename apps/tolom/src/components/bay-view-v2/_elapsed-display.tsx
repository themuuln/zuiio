"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (!startedAt) {
      setDisplay("");
      return;
    }
    const ms = new Date(startedAt).getTime();
    const tick = () => {
      const minutes = Math.floor((Date.now() - ms) / 60000);
      setDisplay(formatElapsed(minutes));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span className={className}>{display}</span>;
}

export function ElapsedTimer({
  startedAt,
}: {
  startedAt: string | null | undefined;
}) {
  const tick = useBayViewTick();

  if (!startedAt || tick === null) return null;

  const ms = tick - new Date(startedAt).getTime();
  const elapsedMs = Math.max(0, ms);
  const elapsedMins = Math.round(elapsedMs / 60_000);
  const display = formatElapsed(Math.floor(elapsedMs / 60_000));

  const isWarning = elapsedMins > 120;
  const isCritical = elapsedMins > 180;

  // Progress: 0-4h maps to 0-100%
  const progress = Math.min((elapsedMins / 240) * 100, 100);

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 overflow-hidden rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums select-none border",
        isCritical
          ? "bg-destructive/10 text-destructive border-destructive/25"
          : isWarning
            ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
            : "bg-muted/60 text-muted-foreground border-border/30",
      )}
    >
      {/* Progress bar background */}
      <span
        className={cn(
          "absolute inset-y-0 left-0 -z-0 transition-[width] duration-1000",
          isCritical
            ? "bg-destructive/8"
            : isWarning
              ? "bg-amber-500/8"
              : "bg-muted/40",
        )}
        style={{ width: `${progress}%` }}
      />
      <Clock className="relative z-10 size-3" />
      <span className="relative z-10">{display}</span>
    </span>
  );
}
