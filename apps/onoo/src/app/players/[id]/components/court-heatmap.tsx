"use client";

import { useState } from "react";
import { HalfCourtSVG } from "@/app/components/basketball/half-court-svg";
import { ShotMarkerLayer } from "@/app/components/basketball/shot-marker-layer";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShotZone {
  /** Zone identifier (e.g. "paint", "mid-left", "three-top").
   *  Must match `zone_key` values in `v_public_shot_zones`. */
  id: string;
  /** SVG shape type. */
  type: "path" | "circle";
  /** SVG `d` attribute (for path-type zones). */
  d?: string;
  /** Center x (for circle-type zones). */
  cx?: number;
  /** Center y (for circle-type zones). */
  cy?: number;
  /** Radius (for circle-type zones). */
  r?: number;
  /** Human-readable label shown in the tooltip. */
  label: string;
  /** Made shots in this zone. */
  made: number;
  /** Attempted shots in this zone. */
  attempted: number;
}

/** Individual shot data point for scatter overlay. */
export interface ShotDataPoint {
  x: number;
  y: number;
  made: boolean;
  shot_type?: string;
  /** Originating game id (present when sourced from stat_events). */
  game_id?: string;
  /** Quarter / period number. */
  period?: number;
}

interface CourtHeatmapProps {
  /** Zone definitions with made/attempted counts. */
  zones: ShotZone[];
  /** Optional individual shot dots for scatter overlay. */
  shots?: ShotDataPoint[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Zone definitions for 500×470 viewBox
// ---------------------------------------------------------------------------

/**
 * Seven standard shot zones covering a FIBA half-court.
 * IDs match the `zone_key` values stored in `v_public_shot_zones`.
 * Positions are relative to the 500×470 court viewBox.
 */
const HEATMAP_ZONES: ShotZone[] = [
  // Paint / Restricted area (around the basket)
  {
    id: "paint",
    type: "circle",
    cx: 250,
    cy: 80,
    r: 55,
    label: "Paint",
    made: 0,
    attempted: 0,
  },
  // Mid-range left
  {
    id: "mid-left",
    type: "circle",
    cx: 145,
    cy: 278,
    r: 55,
    label: "Mid-Range Left",
    made: 0,
    attempted: 0,
  },
  // Mid-range center
  {
    id: "mid-top",
    type: "circle",
    cx: 250,
    cy: 230,
    r: 50,
    label: "Mid-Range Center",
    made: 0,
    attempted: 0,
  },
  // Mid-range right
  {
    id: "mid-right",
    type: "circle",
    cx: 355,
    cy: 278,
    r: 55,
    label: "Mid-Range Right",
    made: 0,
    attempted: 0,
  },
  // Left corner 3
  {
    id: "three-corner-left",
    type: "circle",
    cx: 48,
    cy: 436,
    r: 32,
    label: "Left Corner 3",
    made: 0,
    attempted: 0,
  },
  // Right corner 3
  {
    id: "three-corner-right",
    type: "circle",
    cx: 452,
    cy: 436,
    r: 32,
    label: "Right Corner 3",
    made: 0,
    attempted: 0,
  },
  // Above-break 3 (top of the arc area)
  {
    id: "three-top",
    type: "circle",
    cx: 250,
    cy: 325,
    r: 55,
    label: "Above Break 3",
    made: 0,
    attempted: 0,
  },
];

// ---------------------------------------------------------------------------
// Heat-scale helpers
// ---------------------------------------------------------------------------

function zoneColor(made: number, attempted: number): string {
  if (attempted === 0) return "transparent";
  const pct = made / attempted;
  if (pct >= 0.6) return "var(--brand-sports)";
  if (pct >= 0.5) return "var(--brand-sports-dim)";
  if (pct >= 0.4)
    return "color-mix(in srgb, var(--brand-sports) 55%, #f59e0b 45%)";
  if (pct >= 0.3)
    return "color-mix(in srgb, var(--color-muted-foreground) 40%, var(--brand-sports) 25%)";
  return "color-mix(in srgb, var(--color-muted-foreground) 30%, transparent)";
}

function zoneOpacity(made: number, attempted: number): number {
  if (attempted === 0) return 0;
  return 0.55 + (made / attempted) * 0.35;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Interactive court heatmap composed of a FIBA half-court SVG, zone
 * overlays, and optional shot scatter dots.
 *
 * Tapping / hovering a zone shows a tooltip with FGM / FGA / FG%.
 * Zone fill intensity reflects shooting percentage.
 * When no zone data exists, the empty state is shown.
 */
export function CourtHeatmap({ zones, shots, className }: CourtHeatmapProps) {
  const [activeZone, setActiveZone] = useState<ShotZone | null>(null);
  const [hoveredShot, setHoveredShot] = useState<number | null>(null);

  const hasData = zones.some((z) => z.attempted > 0);

  return (
    <div className={cn("relative", className)}>
      <HalfCourtSVG empty={!hasData}>
        {/* ── Shot zones ──────────────────────────────────────────────── */}
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

          const handlePointerEnter = () => {
            setActiveZone(zone);
            setHoveredShot(null);
          };
          const handlePointerLeave = () => setActiveZone(null);
          const handleClick = () =>
            setActiveZone((prev) => (prev?.id === zone.id ? null : zone));
          const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          };

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
                onKeyDown={handleKeyDown}
                className="cursor-pointer transition-opacity"
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onClick={handleClick}
              />
            );
          }

          // Path-based zones (reserved for future use — not in 7-zone set)
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
              onKeyDown={handleKeyDown}
              className="cursor-pointer transition-opacity"
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              onClick={handleClick}
            />
          );
        })}

        {/* ── Shot scatter dots ──────────────────────────────────────── */}
        {shots && shots.length > 0 && (
          <ShotMarkerLayer
            shots={shots}
            onHoverChange={(index) => setHoveredShot(index)}
          />
        )}
      </HalfCourtSVG>

      {/* ── Color legend ──────────────────────────────────────────────── */}
      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <span className="mr-1">FG%:</span>
        <span className="flex items-center gap-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--color-muted-foreground) 30%, transparent)",
              opacity: 0.55,
            }}
          />
          <span>&lt;30%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--color-muted-foreground) 40%, var(--brand-sports) 25%)",
              opacity: 0.65,
            }}
          />
          <span>30-39%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--brand-sports) 55%, #f59e0b 45%)",
              opacity: 0.75,
            }}
          />
          <span>40-49%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--brand-sports-dim)", opacity: 0.82 }}
          />
          <span>50-59%</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--brand-sports)", opacity: 0.9 }}
          />
          <span>≥60%</span>
        </span>
      </div>

      {/* ── Zone tooltip ──────────────────────────────────────────────── */}
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

      {/* ── Shot tooltip ──────────────────────────────────────────────── */}
      {hoveredShot != null && shots?.[hoveredShot] != null && (
        <div
          className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-sm text-background shadow-lg"
          role="tooltip"
        >
          <p className="font-semibold">
            {shots[hoveredShot].made ? "✓ Made" : "✗ Missed"}
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
// Default zones — zeroed copies of the 7-zone set
// ---------------------------------------------------------------------------

export const DEFAULT_SHOT_ZONES: ShotZone[] = HEATMAP_ZONES.map((zone) => ({
  id: zone.id,
  type: zone.type,
  d: zone.d,
  cx: zone.cx,
  cy: zone.cy,
  r: zone.r,
  label: zone.label,
  made: 0,
  attempted: 0,
}));
