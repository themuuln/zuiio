"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShotZone {
  /** Zone identifier (e.g. "paint", "mid-left", "three-right"). */
  id: string;
  /** SVG path or circle data for the zone. */
  type: "path" | "circle";
  /** SVG `d` attribute (for paths) or center x,y (for circles). */
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  /** Human-readable label for tooltip. */
  label: string;
  /** Shots made in this zone. */
  made: number;
  /** Shots attempted in this zone. */
  attempted: number;
}

interface CourtHeatmapProps {
  zones: ShotZone[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Court SVG constants (half-court, 600×550 viewBox)
// ---------------------------------------------------------------------------

const COURT_WIDTH = 600;
const COURT_HEIGHT = 550;
const COURT_STROKE = "var(--color-muted-foreground / 0.3)";
const COURT_FILL = "none";

// Zone fill color based on FG%
function zoneColor(made: number, attempted: number): string {
  if (attempted === 0) return "transparent";
  const pct = made / attempted;
  // Heat scale: cool blue → warm amber → hot red
  if (pct >= 0.6) return "var(--brand-sports)";
  if (pct >= 0.45) return "var(--brand-sports-light)";
  if (pct >= 0.3) return "var(--color-muted-foreground / 0.2)";
  return "var(--color-muted-foreground / 0.08)";
}

function zoneOpacity(made: number, attempted: number): number {
  if (attempted === 0) return 0;
  return 0.3 + (made / attempted) * 0.5;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Interactive SVG half-court heatmap.
 *
 * Shows shot zones with color intensity based on FG%.
 * Tap/hover a zone for stats. No external dependencies — pure SVG.
 */
export function CourtHeatmap({ zones, className }: CourtHeatmapProps) {
  const [activeZone, setActiveZone] = useState<ShotZone | null>(null);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Шидэлтийн бүсийн зураглал"
      >
        {/* Court outline */}
        <g stroke={COURT_STROKE} fill={COURT_FILL} strokeWidth={2}>
          {/* Outer boundary */}
          <rect x={20} y={20} width={560} height={510} rx={4} />

          {/* Paint / key */}
          <rect x={170} y={20} width={260} height={190} rx={2} />

          {/* Free throw circle */}
          <circle cx={300} cy={210} r={60} />

          {/* Three-point arc */}
          <path d="M 80 20 L 80 160 Q 80 420 300 460 Q 520 420 520 160 L 520 20" />

          {/* Basket */}
          <circle cx={300} cy={60} r={8} fill={COURT_STROKE} />
          <rect
            x={280}
            y={20}
            width={40}
            height={5}
            rx={2}
            fill={COURT_STROKE}
          />

          {/* Backboard */}
          <line x1={260} y1={45} x2={340} y2={45} strokeWidth={3} />

          {/* Restricted area */}
          <path d="M 260 20 Q 260 90 300 90 Q 340 90 340 20" fill="none" />
        </g>

        {/* Shot zones */}
        {zones.map((zone) => {
          const color = zoneColor(zone.made, zone.attempted);
          const opacity = zoneOpacity(zone.made, zone.attempted);
          const isActive = activeZone?.id === zone.id;

          if (zone.type === "circle") {
            return (
              <circle
                key={zone.id}
                cx={zone.cx}
                cy={zone.cy}
                r={zone.r ?? 30}
                fill={color}
                opacity={isActive ? 0.8 : opacity}
                stroke={isActive ? "var(--brand-sports)" : "transparent"}
                strokeWidth={2}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setActiveZone((prev) =>
                      prev?.id === zone.id ? null : zone,
                    );
                }}
                className="cursor-pointer transition-opacity"
                onPointerEnter={() => setActiveZone(zone)}
                onPointerLeave={() => setActiveZone(null)}
                onClick={() =>
                  setActiveZone((prev) => (prev?.id === zone.id ? null : zone))
                }
              />
            );
          }

          return (
            <path
              key={zone.id}
              d={zone.d}
              fill={color}
              opacity={isActive ? 0.8 : opacity}
              stroke={isActive ? "var(--brand-sports)" : "transparent"}
              strokeWidth={2}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setActiveZone((prev) => (prev?.id === zone.id ? null : zone));
              }}
              className="cursor-pointer transition-opacity"
              onPointerEnter={() => setActiveZone(zone)}
              onPointerLeave={() => setActiveZone(null)}
              onClick={() =>
                setActiveZone((prev) => (prev?.id === zone.id ? null : zone))
              }
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {activeZone && (
        <div
          className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-sm text-background shadow-lg"
          role="tooltip"
        >
          <p className="font-semibold">{activeZone.label}</p>
          <p className="tabular-nums">
            {activeZone.made}/{activeZone.attempted}{" "}
            <span className="text-background/70">
              (
              {activeZone.attempted > 0
                ? ((activeZone.made / activeZone.attempted) * 100).toFixed(1)
                : "—"}
              %)
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default zones — standard basketball half-court shot zones
// ---------------------------------------------------------------------------

export const DEFAULT_SHOT_ZONES: ShotZone[] = [
  {
    id: "paint",
    type: "path",
    d: "M 172 22 L 172 208 L 428 208 L 428 22 Z",
    label: "Өрөө (Paint)",
    made: 0,
    attempted: 0,
  },
  {
    id: "mid-left",
    type: "path",
    d: "M 22 22 L 170 22 L 170 300 Q 100 300 22 250 Z",
    label: "Дунд — зүүн",
    made: 0,
    attempted: 0,
  },
  {
    id: "mid-right",
    type: "path",
    d: "M 430 22 L 578 22 L 578 250 Q 500 300 430 300 Z",
    label: "Дунд — баруун",
    made: 0,
    attempted: 0,
  },
  {
    id: "mid-top",
    type: "path",
    d: "M 170 210 L 430 210 L 430 310 L 170 310 Z",
    label: "Дунд — дээд",
    made: 0,
    attempted: 0,
  },
  {
    id: "three-left",
    type: "path",
    d: "M 22 252 Q 100 302 170 312 L 170 530 L 22 530 Z",
    label: "Гурван оноо — зүүн",
    made: 0,
    attempted: 0,
  },
  {
    id: "three-right",
    type: "path",
    d: "M 578 252 Q 500 302 430 312 L 430 530 L 578 530 Z",
    label: "Гурван оноо — баруун",
    made: 0,
    attempted: 0,
  },
  {
    id: "three-top",
    type: "path",
    d: "M 170 312 L 430 312 L 430 530 L 170 530 Z",
    label: "Гурван оноо — дээд",
    made: 0,
    attempted: 0,
  },
];
