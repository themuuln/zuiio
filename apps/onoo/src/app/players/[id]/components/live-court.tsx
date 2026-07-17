"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveCourtProps {
  /** Whether a game is currently live. */
  isLive: boolean;
  /** Optional: most recent shot {x, y} normalized 0-1. */
  lastShot?: { x: number; y: number; made: boolean } | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// CSS keyframes
// ---------------------------------------------------------------------------

const LIVE_COURT_STYLES = `
@keyframes court-pulse {
  0%, 100% { opacity: 0.4; r: 6; }
  50%      { opacity: 1;   r: 10; }
}

@keyframes court-shot-ring {
  0%   { r: 4; opacity: 1; stroke-width: 3; }
  100% { r: 30; opacity: 0; stroke-width: 0.5; }
}

.live-court-pulse {
  animation: court-pulse 2s ease-in-out infinite;
}

.live-court-shot {
  animation: court-shot-ring 1s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .live-court-pulse,
  .live-court-shot {
    animation: none !important;
  }
}
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Animated half-court indicator for live games.
 *
 * Shows a pulsing basketball dot when live, and optionally
 * displays the last shot with a ripple animation.
 * Pure SVG + CSS — no dependencies.
 */
export function LiveCourt({
  isLive,
  lastShot,
  className,
}: LiveCourtProps) {
  if (!isLive && !lastShot) return null;

  // Inject styles
  if (typeof document !== "undefined") {
    const existing = document.getElementById("live-court-styles");
    if (!existing) {
      const style = document.createElement("style");
      style.id = "live-court-styles";
      style.textContent = LIVE_COURT_STYLES;
      document.head.appendChild(style);
    }
  }

  // Map normalized 0-1 coords to court viewBox
  const shotCx = lastShot ? 20 + lastShot.x * 560 : 300;
  const shotCy = lastShot ? 20 + lastShot.y * 510 : 260;

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl", className)}
      aria-label={isLive ? "Тоглолт явагдаж байна" : "Сүүлчийн шидэлт"}
    >
      <svg
        viewBox="0 0 600 550"
        className="w-full opacity-20"
        aria-hidden="true"
      >
        {/* Simplified court outline */}
        <g
          stroke="var(--color-muted-foreground)"
          fill="none"
          strokeWidth={1.5}
        >
          <rect x={20} y={20} width={560} height={510} rx={4} />
          <rect x={170} y={20} width={260} height={190} rx={2} />
          <circle cx={300} cy={210} r={60} />
          <path d="M 80 20 L 80 160 Q 80 420 300 460 Q 520 420 520 160 L 520 20" />
          <circle cx={300} cy={60} r={8} fill="var(--color-muted-foreground)" />
        </g>

        {/* Live pulse dot */}
        {isLive && (
          <circle
            cx={300}
            cy={60}
            r={6}
            fill="var(--brand-sports)"
            className="live-court-pulse"
          />
        )}

        {/* Last shot marker */}
        {lastShot && (
          <>
            {/* Ripple ring */}
            <circle
              cx={shotCx}
              cy={shotCy}
              fill="none"
              stroke={
                lastShot.made ? "var(--brand-sports)" : "var(--color-destructive)"
              }
              className="live-court-shot"
            />
            {/* Shot dot */}
            <circle
              cx={shotCx}
              cy={shotCy}
              r={4}
              fill={
                lastShot.made ? "var(--brand-sports)" : "var(--color-destructive)"
              }
              opacity={0.8}
            />
          </>
        )}
      </svg>
    </div>
  );
}
