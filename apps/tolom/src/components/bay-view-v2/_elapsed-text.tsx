"use client";

import { useEffect, useState } from "react";

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
      const d = Math.floor((Date.now() - ms) / 60000);
      setDisplay(d < 60 ? `${d}m` : `${Math.floor(d / 60)}h ${d % 60}m`);
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span className={className}>{display}</span>;
}
