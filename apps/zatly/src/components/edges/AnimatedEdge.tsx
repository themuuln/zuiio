"use client";

import { memo } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";

/**
 * AnimatedEdge renders an edge with a flowing dash animation.
 * It supports multiple path types (smoothstep, step, bezier, straight)
 * based on the edge's data.pathType or falls back to smoothstep.
 *
 * The flowing dash animation is applied via the CSS class "animated-edge-path"
 * which uses stroke-dasharray + stroke-dashoffset keyframe animation.
 *
 * Props not destructured from EdgeProps are spread onto the <path>
 * via BaseEdge's forward-compatible API.
 */
export const AnimatedEdge = memo(function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  // Determine which path type to render
  const pathType = (data?.pathType as string) ?? "smoothstep";

  let edgePath: string;
  const bezierOffset = 0;

  switch (pathType) {
    case "step":
      // Step is smoothstep with borderRadius=0
      [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0,
      });
      break;
    case "bezier":
      [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      break;
    case "straight":
      [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      break;
    case "smoothstep":
    default:
      [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      break;
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        ...style,
        strokeDasharray: "8 4",
        animation: "edgeDashFlow 0.5s linear infinite",
      }}
      markerEnd={markerEnd}
      className="animated-edge-path"
    />
  );
});
