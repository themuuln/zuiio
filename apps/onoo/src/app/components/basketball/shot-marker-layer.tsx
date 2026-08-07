"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShotMarker {
  x: number;
  y: number;
  made: boolean;
  shot_type?: string;
  game_id?: string;
  period?: number;
}

interface ShotMarkerLayerProps {
  /** Individual shot data points to render as dots. */
  shots: ShotMarker[];
  /** Called when the user hovers a shot marker (or null when leaving). */
  onHoverChange?: (index: number | null, shot: ShotMarker | null) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Scale factor from the original 600×550 coordinate space (in which shot
 * coordinates are stored) to the 500×470 viewBox used by this court.
 */
const SCALE_X = 500 / 600;
const SCALE_Y = 470 / 550;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders individual shot-attempt dots on the court as a scatter overlay.
 *
 * Green dots = made, red dots = missed. Opacity 0.55 by default, full
 * opacity on hover. Dots enlarge slightly on hover for better readability.
 * Coordinates are scaled from the 600×550 storage space to the 500×470
 * viewBox of the court SVG.
 */
export function ShotMarkerLayer({
  shots,
  onHoverChange,
}: ShotMarkerLayerProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!shots || shots.length === 0) return null;

  return (
    <g className="shot-scatter">
      {shots.map((shot, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: shots are keyless; index doubles as the hover identity
        <g key={i}>
          <circle
            cx={shot.x * SCALE_X}
            cy={shot.y * SCALE_Y}
            r={hoveredIndex === i ? 5.5 : 4}
            fill={shot.made ? "#22c55e" : "#ef4444"}
            opacity={hoveredIndex === i ? 1 : 0.55}
            stroke={shot.made ? "#16a34a" : "#dc2626"}
            strokeWidth={1}
            style={{ transition: "r 0.15s, opacity 0.15s" }}
            className="cursor-pointer"
            onPointerEnter={() => {
              setHoveredIndex(i);
              onHoverChange?.(i, shot);
            }}
            onPointerLeave={() => {
              setHoveredIndex(null);
              onHoverChange?.(null, null);
            }}
          />
        </g>
      ))}
    </g>
  );
}
