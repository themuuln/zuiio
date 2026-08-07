"use client";

import { cn } from "@/lib/utils";

interface CompareStat {
  readonly label: string;
  readonly left: number;
  readonly right: number;
}

interface CompareBarsProps {
  readonly leftName: string;
  readonly rightName: string;
  readonly stats: CompareStat[];
  readonly className?: string;
}

export function CompareBars({
  leftName,
  rightName,
  stats,
  className,
}: CompareBarsProps) {
  return (
    <section
      aria-labelledby="compare-bars-heading"
      className={cn("w-full", className)}
    >
      <h2 id="compare-bars-heading" className="sr-only">
        Үзүүлэлтийн тулаан
      </h2>
      <div className="flex flex-col gap-1">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-2">
          <span className="truncate text-right text-sm font-bold tabular-nums text-muted-foreground">
            {leftName}
          </span>
          <span className="w-24" aria-hidden="true" />
          <span className="truncate text-left text-sm font-bold tabular-nums text-muted-foreground">
            {rightName}
          </span>
        </div>

        {/* Stat rows */}
        {stats.map((stat) => {
          const maxVal = Math.max(stat.left, stat.right, 1);
          const leftPct = (stat.left / maxVal) * 100;
          const rightPct = (stat.right / maxVal) * 100;
          const leftWins = stat.left >= stat.right;
          const rightWins = stat.right >= stat.left;

          return (
            <div
              key={stat.label}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
            >
              {/* Left player bar + value */}
              <div className="flex items-center justify-end gap-2">
                <span
                  className={cn(
                    "text-lg font-black tabular-nums",
                    leftWins
                      ? "text-[var(--brand-sports)]"
                      : "text-muted-foreground",
                  )}
                >
                  {stat.left.toFixed(1)}
                </span>
                <div
                  className="relative h-3 w-full max-w-[12rem]"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "absolute right-0 top-0 h-full rounded-l-full transition-all duration-500",
                      leftWins ? "bg-[var(--brand-sports)]" : "bg-muted",
                    )}
                    style={{ width: `${leftPct}%` }}
                  />
                </div>
              </div>

              {/* Stat label */}
              <span className="w-24 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>

              {/* Right player bar + value */}
              <div className="flex items-center gap-2">
                <div
                  className="relative h-3 w-full max-w-[12rem]"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full rounded-r-full transition-all duration-500",
                      rightWins ? "bg-[var(--brand-sports)]" : "bg-muted",
                    )}
                    style={{ width: `${rightPct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-lg font-black tabular-nums",
                    rightWins
                      ? "text-[var(--brand-sports)]"
                      : "text-muted-foreground",
                  )}
                >
                  {stat.right.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <span className="inline-block size-2 rounded-full bg-[var(--brand-sports)] align-middle" />{" "}
        Давуу тал &nbsp;·&nbsp;{" "}
        <span className="inline-block size-2 rounded-full bg-muted align-middle" />{" "}
        Бага утга
      </p>
    </section>
  );
}
