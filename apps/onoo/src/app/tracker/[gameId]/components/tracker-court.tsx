"use client";

import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrackerCourtProps {
  /** Called when user taps a position on the court. x,y in 0-600 / 0-550 space. */
  onShotLocation: (x: number, y: number) => void;
  /** Cancel shot placement. */
  onCancel: () => void;
  /** Label shown above the court. */
  label?: string;
}

// ---------------------------------------------------------------------------
// Court SVG constants (matches court-heatmap.tsx: 600×550 viewBox)
// ---------------------------------------------------------------------------

const COURT_WIDTH = 600;
const COURT_HEIGHT = 550;
const COURT_STROKE = "rgba(255,255,255,0.5)";

/**
 * Interactive half-court for shot placement in the tracker.
 *
 * The scorer taps a spot on the court after recording a made/missed shot.
 * Coordinates are returned in the same 600×550 space used by the player
 * profile heatmap and v_public_shot_zones view.
 */
export function TrackerCourt({
  onShotLocation,
  onCancel,
  label = "Шидэлтийн байршилыг сонгоно уу",
}: TrackerCourtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dot, setDot] = useState<{ x: number; y: number } | null>(null);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    // Clamp to court bounds
    const x = Math.max(20, Math.min(580, Math.round(svgPt.x)));
    const y = Math.max(20, Math.min(530, Math.round(svgPt.y)));

    setDot({ x, y });
  }, []);

  const confirm = useCallback(() => {
    if (dot) onShotLocation(dot.x, dot.y);
  }, [dot, onShotLocation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Keyboard users have no pointer position — place the shot at court center.
      setDot({
        x: Math.round(COURT_WIDTH / 2),
        y: Math.round(COURT_HEIGHT / 2),
      });
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-foreground">{label}</p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
        className="w-full max-w-[280px] cursor-crosshair touch-none select-none"
        aria-label="Shot location picker"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Court background */}
        <rect
          x={20}
          y={20}
          width={560}
          height={510}
          rx={4}
          fill="rgba(255,255,255,0.08)"
          stroke={COURT_STROKE}
          strokeWidth={2}
        />

        {/* Paint / key */}
        <rect
          x={170}
          y={20}
          width={260}
          height={190}
          rx={2}
          fill="none"
          stroke={COURT_STROKE}
          strokeWidth={1.5}
        />

        {/* Free throw circle */}
        <circle
          cx={300}
          cy={210}
          r={60}
          fill="none"
          stroke={COURT_STROKE}
          strokeWidth={1.5}
        />

        {/* Three-point arc */}
        <path
          d="M 80 20 L 80 160 Q 80 420 300 460 Q 520 420 520 160 L 520 20"
          fill="none"
          stroke={COURT_STROKE}
          strokeWidth={1.5}
        />

        {/* Basket */}
        <circle cx={300} cy={60} r={8} fill={COURT_STROKE} />
        <rect x={280} y={20} width={40} height={5} rx={2} fill={COURT_STROKE} />

        {/* Backboard */}
        <line
          x1={260}
          y1={45}
          x2={340}
          y2={45}
          stroke={COURT_STROKE}
          strokeWidth={3}
        />

        {/* Restricted area */}
        <path
          d="M 260 20 Q 260 90 300 90 Q 340 90 340 20"
          fill="none"
          stroke={COURT_STROKE}
          strokeWidth={1}
        />

        {/* Shot dot */}
        {dot && (
          <circle
            cx={dot.x}
            cy={dot.y}
            r={10}
            fill="var(--brand-sports, #f59e0b)"
            stroke="white"
            strokeWidth={2}
          />
        )}
      </svg>

      <div className="flex gap-2">
        {dot && (
          <button
            type="button"
            onClick={confirm}
            className="rounded bg-green-600 px-4 py-2 text-sm font-bold hover:bg-green-700"
          >
            Баталгаажуулах
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-gray-600 px-4 py-2 text-sm font-bold hover:bg-gray-500"
        >
          Цуцлах
        </button>
      </div>
    </div>
  );
}
