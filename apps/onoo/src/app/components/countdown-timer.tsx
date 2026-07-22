"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetIso: string;
  label?: string;
  className?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({
  targetIso,
  label = "Дараагийн тоглолт хүртэл",
  className,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(targetIso).getTime() - Date.now()),
  );

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const ms = new Date(targetIso).getTime() - Date.now();
      setRemaining(Math.max(0, ms));
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso, remaining]);

  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const units = [
    { value: days, label: "Өдөр" },
    { value: hours, label: "Цаг" },
    { value: minutes, label: "Минут" },
    { value: seconds, label: "Секунд" },
  ];

  return (
    <div
      className={cn("flex items-center justify-center gap-4 py-3", className)}
      role="timer"
      aria-label={`${label}: ${days} өдөр, ${hours} цаг, ${minutes} минут, ${seconds} секунд`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        {label}
      </p>
      <div className="flex items-center gap-2">
        {units.map(({ value, label: unitLabel }, i) => (
          <span key={unitLabel} className="flex items-center gap-1">
            <span className="stat-number text-lg tabular-nums text-warning">
              {pad(value)}
            </span>
            <span className="text-xs text-sidebar-foreground/40">
              {unitLabel}
            </span>
            {i < units.length - 1 && (
              <span className="mx-1 text-sidebar-foreground/20">:</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
