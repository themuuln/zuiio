"use client";

import { useEffect, useState } from "react";

function formatElapsed(minutes: number): string {
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function ElapsedTimer({
  since,
  className,
}: {
  since: string | null | undefined;
  className?: string;
}) {
  const [elapsed, setElapsed] = useState<string>("—");

  useEffect(() => {
    if (!since) {
      setElapsed("—");
      return;
    }

    const tick = () => {
      const now = Date.now();
      const then = new Date(since).getTime();
      const diff = Math.max(0, Math.floor((now - then) / 60000));
      setElapsed(formatElapsed(diff));
    };

    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [since]);

  return <span className={className}>{elapsed}</span>;
}
