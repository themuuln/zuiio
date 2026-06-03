"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

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
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  const ms = new Date(startedAt).getTime();
  const elapsed = Math.max(0, now - ms);
  const display = formatDuration(elapsed);

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded font-mono tabular-nums select-none border border-border/30">
      <Clock className="size-3 animate-pulse text-primary/70" />
      {display}
    </span>
  );
}
