"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
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

  if (!startedAt) return null;

  const ms = tick - new Date(startedAt).getTime();
  const elapsedMs = Math.max(0, ms);
  const elapsedMinutes = Math.round(elapsedMs / 60_000);
  const display = formatElapsed(Math.floor(elapsedMs / 60_000));

  const isWarning = elapsedMinutes > 120;
  const isCritical = elapsedMinutes > 180;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums select-none border",
        isCritical
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 animate-pulse"
          : isWarning
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
            : "bg-muted/60 text-muted-foreground border-border/30",
      )}
    >
      <Clock className="size-3" />
      {display}
    </span>
  );
}
