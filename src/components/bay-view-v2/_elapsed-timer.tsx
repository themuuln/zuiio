"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Elapsed time since a job started.
 * Shows urgency styling when > 2 hours.
 */
export function ElapsedTimer({
  startedAt,
}: {
  startedAt: string | null | undefined;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  const ms = new Date(startedAt).getTime();
  const elapsedMs = Math.max(0, now - ms);
  const elapsedMinutes = Math.round(elapsedMs / 60_000);
  const display = formatDuration(elapsedMs);

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
