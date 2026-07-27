"use client";

// ---------------------------------------------------------------------------
// Point Differential Sparkline — SVG bar chart of last N game differentials
// ---------------------------------------------------------------------------

interface PointDifferentialSparklineProps {
  /** Array of per-game point differentials (positive = win margin, negative = loss deficit). */
  differentials: number[];
  /** Bar width in px. Default: 8 */
  barWidth?: number;
  /** Gap between bars in px. Default: 3 */
  gap?: number;
  /** SVG height in px. Default: 32 */
  height?: number;
  className?: string;
}

export function PointDifferentialSparkline({
  differentials,
  barWidth = 8,
  gap = 3,
  height = 32,
  className,
}: PointDifferentialSparklineProps) {
  if (differentials.length === 0) return null;

  const totalBars = Math.min(differentials.length, 10);
  const recent = differentials.slice(0, totalBars).reverse(); // left-to-right chronological
  const maxAbs = Math.max(1, ...recent.map((d) => Math.abs(d)));
  const midLine = height / 2;
  const maxBarHeight = midLine - 2; // leave 2px breathing room

  const svgWidth = totalBars * (barWidth + gap) - gap;

  return (
    <svg
      width={svgWidth}
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      aria-label={`Сүүлийн ${totalBars} тоглолтын онооны зөрүүний график`}
      className={className}
      role="img"
    >
      <line
        x1={0}
        y1={midLine}
        x2={svgWidth}
        y2={midLine}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={1}
      />
      {recent.map((diff, i) => {
        const isPositive = diff >= 0;
        const absDiff = Math.abs(diff);
        const barH = Math.max(2, (absDiff / maxAbs) * maxBarHeight);
        const x = i * (barWidth + gap);
        const y = isPositive ? midLine - barH : midLine;

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barH}
            rx={1.5}
            ry={1.5}
            fill={
              isPositive
                ? "var(--color-emerald-500, #10b981)"
                : "var(--color-red-500, #ef4444)"
            }
            fillOpacity={0.8}
          >
            <title>
              {isPositive ? "+" : ""}
              {diff}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}
