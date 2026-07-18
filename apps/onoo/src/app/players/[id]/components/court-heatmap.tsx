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

/** Individual shot data point for scatter overlay. */
export interface ShotDataPoint {
  x: number;
  y: number;
  made: boolean;
  shot_type?: string;
  /** originating game id (present when sourced from stat_events) */
  game_id?: string;
  /** quarter / period number */
  period?: number;
}

interface CourtHeatmapProps {
  zones: ShotZone[];
  /** Optional individual shot dots for scatter overlay. */
  shots?: ShotDataPoint[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Court SVG constants (half-court, 600×550 viewBox)
// ---------------------------------------------------------------------------
const COURT_WIDTH = 600;
const COURT_HEIGHT = 550;

const COURT_STROKE = "var(--color-muted-foreground)";
const COURT_FILL = "none";

// ── Heat-scale palette (FG% → visible, distinct color) ──────────────
function zoneColor(made: number, attempted: number): string {
  if (attempted === 0) return "transparent";
  const pct = made / attempted;
  if (pct >= 0.6) return "var(--brand-sports)";                    // hot amber
  if (pct >= 0.5) return "var(--brand-sports-dim)";               // deep amber
  if (pct >= 0.4) return "color-mix(in srgb, var(--brand-sports) 55%, #f59e0b 45%)";  // orange-amber
  if (pct >= 0.3) return "color-mix(in srgb, var(--color-muted-foreground) 40%, var(--brand-sports) 25%)";  // muted warm
  return "color-mix(in srgb, var(--color-muted-foreground) 30%, transparent)";  // cool gray
}

function zoneOpacity(made: number, attempted: number): number {
  if (attempted === 0) return 0;
  // Range: 0.55 (cold) → 0.9 (hot) — always clearly visible
  return 0.55 + (made / attempted) * 0.35;
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
export function CourtHeatmap({ zones, shots, className }: CourtHeatmapProps) {
  const [activeZone, setActiveZone] = useState<ShotZone | null>(null);
  const [hoveredShot, setHoveredShot] = useState<number | null>(null);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Шидэлтийн бүсийн зураглал"
      >
        {/* Court outline */}
        <g stroke={COURT_STROKE} fill={COURT_FILL} strokeWidth={2.5} opacity={0.55}>
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
          const isEmpty = zone.attempted === 0;
          const emptyStroke = isEmpty
            ? "color-mix(in srgb, var(--color-muted-foreground) 35%, transparent)"
            : isActive
              ? "var(--brand-sports)"
              : "transparent";
          const emptyStrokeDash = isEmpty ? "4 3" : undefined;

          if (zone.type === "circle") {
            return (
              <circle
                key={zone.id}
                cx={zone.cx}
                cy={zone.cy}
                r={zone.r ?? 30}
                fill={color}
                opacity={isActive ? 0.85 : isEmpty ? 0.35 : opacity}
                stroke={emptyStroke}
                strokeDasharray={emptyStrokeDash}
                strokeWidth={isEmpty ? 1.5 : 2}
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
              opacity={isActive ? 0.85 : isEmpty ? 0.35 : opacity}
              stroke={emptyStroke}
              strokeDasharray={emptyStrokeDash}
              strokeWidth={isEmpty ? 1.5 : 2}
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
        {/* Scatter overlay — individual shot dots */}
        {shots && shots.length > 0 && (
          <g className="shot-scatter">
            {shots.map((shot, i) => (
              <g key={i}>
                <circle
                  cx={shot.x}
                  cy={shot.y}
                  r={hoveredShot === i ? 6 : 4.5}
                  fill={shot.made ? "#22c55e" : "#ef4444"}
                  opacity={hoveredShot === i ? 1 : 0.75}
                  stroke={shot.made ? "#16a34a" : "#dc2626"}
                  strokeWidth={1}
                  style={{ transition: "r 0.15s, opacity 0.15s" }}
                  onPointerEnter={() => setHoveredShot(i)}
                  onPointerLeave={() => setHoveredShot(null)}
                />
              </g>
            ))}
          </g>
        )}
      </svg>
      {/* Color legend */}
      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <span className="mr-1">FG%:</span>
        <span className="flex items-center gap-0.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "color-mix(in srgb, var(--color-muted-foreground) 30%, transparent)", opacity: 0.55 }} />
          <span>&lt;30%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "color-mix(in srgb, var(--color-muted-foreground) 40%, var(--brand-sports) 25%)", opacity: 0.65 }} />
          <span>30-39%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "color-mix(in srgb, var(--brand-sports) 55%, #f59e0b 45%)", opacity: 0.75 }} />
          <span>40-49%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--brand-sports-dim)", opacity: 0.82 }} />
          <span>50-59%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--brand-sports)", opacity: 0.9 }} />
          <span>≥60%</span>
        </span>
      </div>

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
      {/* Shot tooltip */}
      {hoveredShot !== null && shots && shots[hoveredShot] && (
        <div
          className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-sm text-background shadow-lg"
          role="tooltip"
        >
          <p className="font-semibold">
            {shots[hoveredShot].made ? "✓ Мade" : "✗ Missed"}
          </p>
          {shots[hoveredShot].shot_type && (
            <p className="text-background/70 text-xs capitalize">
              {shots[hoveredShot].shot_type}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default zones — derived from shared court-zones.ts
// ---------------------------------------------------------------------------

import { COURT_ZONES } from "./court-zones";

export const DEFAULT_SHOT_ZONES: ShotZone[] = COURT_ZONES.map(
  ({ weight2pt: _w2, weight3pt: _w3, ...rest }) => ({
    ...rest,
    made: 0,
    attempted: 0,
  }),
);
