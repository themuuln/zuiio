"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatFlipCardProps {
  /** Primary value (front face). */
  value: number;
  /** Secondary value (back face) — e.g. career total or per-36. */
  backValue: number;
  /** Stat label (e.g. "ОНОО"). */
  label: string;
  /** Label for back face. */
  backLabel?: string;
  /** Decimal precision. Default 1. */
  precision?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// CSS keyframes injected once
// ---------------------------------------------------------------------------

const FLIP_CARD_STYLES = `
.stat-flip-card {
  perspective: 600px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.stat-flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.stat-flip-card[data-flipped="true"] .stat-flip-inner {
  transform: rotateY(180deg);
}

.stat-flip-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  border-radius: inherit;
  padding: 1rem;
}

.stat-flip-back {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .stat-flip-inner {
    transition: none !important;
  }
}
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * 3D flip card for stat display.
 *
 * Front: season stat. Back: career stat (or alternate view).
 * Tap/click to flip. Auto-resets after 4 seconds.
 * Respects prefers-reduced-motion.
 */
export function StatFlipCard({
  value,
  backValue,
  label,
  backLabel = "Карьер",
  precision = 1,
  className,
}: StatFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const styleInjected = useRef(false);

  // Inject styles once
  if (!styleInjected.current && typeof document !== "undefined") {
    const existing = document.getElementById("stat-flip-card-styles");
    if (!existing) {
      const style = document.createElement("style");
      style.id = "stat-flip-card-styles";
      style.textContent = FLIP_CARD_STYLES;
      document.head.appendChild(style);
    }
    styleInjected.current = true;
  }

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
    // Auto-reset after 4s
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlipped(false), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={cn(
        "stat-flip-card group h-28 w-full rounded-xl bg-muted/50 text-center transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      data-flipped={flipped}
      onClick={handleFlip}
      aria-label={`${label}: ${value.toFixed(precision)}. Нар дараглав: ${backLabel}: ${backValue.toFixed(precision)}`}
    >
      <div className="stat-flip-inner">
        {/* Front face — season stat */}
        <div className="stat-flip-face bg-muted/50">
          <span className="stat-number text-3xl font-bold tabular-nums sm:text-4xl">
            {value.toFixed(precision)}
          </span>
          <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground/60">
            Нар →
          </span>
        </div>

        {/* Back face — career stat */}
        <div className="stat-flip-face stat-flip-back bg-muted/80">
          <span className="stat-number text-3xl font-bold tabular-nums text-warning-foreground sm:text-4xl">
            {backValue.toFixed(precision)}
          </span>
          <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {backLabel}
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground/60">
            Нар →
          </span>
        </div>
      </div>
    </button>
  );
}
