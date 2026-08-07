"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FLIP_REDUCED_MOTION_STYLES = `
@media (prefers-reduced-motion: reduce) {
  .flip-stat-card-3d {
    transition: none !important;
  }
}
`;

interface FlipStatCardProps {
  /** Primary stat value (front face) */
  value: number | null;
  /** Stat label (e.g., "PPG") */
  label: string;
  /** Secondary display (back face) — e.g., "#2 in league" or "25.1 per 36min" */
  backLabel: string;
  /** Precision for primary value */
  precision?: number;
  /** Use accent color */
  accent?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Interactive stat card that flips on click to reveal a secondary stat.
 * Uses CSS 3D transform for a satisfying rotation animation.
 */
export function FlipStatCard({
  value,
  label,
  backLabel,
  precision = 1,
  accent = false,
  className,
}: FlipStatCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Inject reduced-motion override once
  if (typeof document !== "undefined") {
    const id = "flip-stat-card-reduced-motion";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = FLIP_REDUCED_MOTION_STYLES;
      document.head.appendChild(style);
    }
  }

  const hasData = value != null;

  return (
    <button
      type="button"
      onClick={() => setIsFlipped(!isFlipped)}
      className={cn(
        "group relative flex flex-col gap-1 text-left outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
        "cursor-pointer select-none",
        className,
      )}
      aria-label={`${label}: ${hasData ? value?.toFixed(precision) : "–"}. Нэмэлт мэдээлэл харах.`}
    >
      {/* Flip container */}
      <div
        className="flip-stat-card-3d relative transition-transform duration-500 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front face — primary stat */}
        <div
          className="flex flex-col gap-1"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span
            className={cn(
              "font-black tabular-nums leading-none tracking-tight text-3xl sm:text-4xl",
              accent ? "text-[var(--brand-sports)]" : "",
            )}
          >
            {hasData ? value.toFixed(precision) : "–"}
          </span>
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-wider text-muted-foreground",
              accent ? "text-[var(--brand-sports)]/70" : "",
            )}
          >
            {label}
          </span>
        </div>

        {/* Back face — secondary stat */}
        <div
          className="absolute inset-0 flex flex-col gap-1"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span
            className={cn(
              "font-bold tabular-nums leading-none tracking-tight text-lg sm:text-xl",
              accent ? "text-[var(--brand-sports)]" : "text-foreground",
            )}
          >
            {backLabel}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
      </div>

      {/* Flip indicator */}
      <span
        className={cn(
          "text-[10px] text-muted-foreground/50 transition-opacity",
          "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
        aria-hidden="true"
      >
        Эргүүлэх ↑
      </span>
    </button>
  );
}
