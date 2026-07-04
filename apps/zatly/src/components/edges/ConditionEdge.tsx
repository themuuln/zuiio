"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

/**
 * ConditionEdge renders a smoothstep path with a "Yes" or "No" label
 * near the source handle. The label is determined by the sourceHandleId
 * ("yes" → green label, "no" → red label).
 *
 * The edge respects:
 * - animated prop (flowing dash animation via CSS class)
 * - selected state (ring color via CSS)
 * - dark mode via CSS custom properties
 */
export const ConditionEdge = memo(function ConditionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  animated,
  sourceHandleId,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = sourceHandleId === "yes" ? "Yes" : "No";
  const labelColor = sourceHandleId === "yes" ? "#22c55e" : "#ef4444";

  // Position label closer to source (30% from source)
  const edgeLabelX = sourceX + (labelX - sourceX) * 0.3;
  const edgeLabelY = sourceY + (labelY - sourceY) * 0.3;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        className={animated ? "animated-edge-path" : undefined}
      />
      <EdgeLabelRenderer>
        <div
          className="condition-edge-label nodrag nopan"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${edgeLabelX}px,${edgeLabelY}px)`,
            background: labelColor,
            color: "#fff",
            padding: "2px 7px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1.4,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
