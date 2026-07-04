import type { EdgeTypes } from "@xyflow/react";
import { ConditionEdge } from "./ConditionEdge";
import { AnimatedEdge } from "./AnimatedEdge";

/**
 * Custom edge types for the flow canvas.
 *
 * - `conditionEdge` — smoothstep path with "Yes"/"No" labels on condition branches
 * - `animatedEdge` — flowing dash animation for toggled-animated edges
 */
export const edgeTypes: EdgeTypes = {
  conditionEdge: ConditionEdge,
  animatedEdge: AnimatedEdge,
};
