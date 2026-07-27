"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HalfCourtSVGProps {
  /** SVG overlay elements (zone shapes, shot markers). */
  children?: React.ReactNode;
  className?: string;
  /** When true, shows the empty-state overlay over the court. */
  empty?: boolean;
  /** Message shown in the empty-state overlay. */
  emptyMessage?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COURT_STROKE = "var(--color-muted-foreground)";
const COURT_FILL = "none";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * FIBA-style half-court SVG in a 500×470 viewBox.
 *
 * Draws the court outline, paint / key, free-throw circle, three-point arc,
 * basket, backboard, restricted-area arc, and a half-court line marker.
 * Child elements (zone overlays, shot scatter dots) are rendered above the
 * court markings. An optional empty-state overlay can be shown on top.
 */
export function HalfCourtSVG({
  children,
  className,
  empty = false,
  emptyMessage = "No shot data available",
}: HalfCourtSVGProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 500 470"
        className="w-full"
        role="img"
        aria-label="Багана шидэлтийн талбай"
      >
        {/* ── Court markings ────────────────────────────────────────── */}
        <g
          stroke={COURT_STROKE}
          fill={COURT_FILL}
          strokeWidth={2.5}
          opacity={0.55}
        >
          {/* Outer boundary */}
          <rect x={17} y={17} width={467} height={436} rx={4} />

          {/* Paint / key */}
          <rect x={142} y={17} width={217} height={162} rx={2} />

          {/* Free-throw circle */}
          <circle cx={250} cy={180} r={51} />

          {/* Three-point arc */}
          <path d="M 67 17 L 67 137 Q 67 359 250 393 Q 433 359 433 137 L 433 17" />

          {/* Basket rim */}
          <circle cx={250} cy={51} r={7} fill={COURT_STROKE} />
          <rect
            x={233}
            y={17}
            width={33}
            height={4}
            rx={2}
            fill={COURT_STROKE}
          />

          {/* Backboard */}
          <line x1={217} y1={38} x2={283} y2={38} strokeWidth={3} />

          {/* Restricted-area arc */}
          <path d="M 217 17 Q 217 77 250 77 Q 283 77 283 17" fill="none" />

          {/* Half-court line marker */}
          <line x1={17} y1={235} x2={484} y2={235} strokeWidth={1.5} />
          <circle cx={250} cy={235} r={4} fill={COURT_STROKE} />
        </g>

        {/* ── Overlay children (zones, shot markers) ────────────────── */}
        {children}
      </svg>

      {/* ── Empty-state overlay ────────────────────────────────────── */}
      {empty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-background/80 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground">
              {emptyMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
