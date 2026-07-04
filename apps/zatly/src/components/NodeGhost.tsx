"use client";

import type { FlowNodeType } from "@/types/flow";
import { NODE_TEMPLATES } from "@/store/defaults";
import { NodeWrapper } from "@/components/nodes/NodeWrapper";

interface NodeGhostProps {
  type: FlowNodeType;
  x: number;
  y: number;
}

export function NodeGhost({ type, x, y }: NodeGhostProps) {
  const template = NODE_TEMPLATES.find((t) => t.type === type);
  const selected = false;

  return (
    <div
      className="pointer-events-none fixed z-50 opacity-70 scale-95"
      style={{
        left: x - 90,
        top: y - 20,
        width: 200,
      }}
    >
      <NodeWrapper
        selected={selected}
        color={template?.color ?? "#666"}
        icon={template?.icon ?? "?"}
        label={template?.label ?? type}
      >
        <div className="h-3 w-24 rounded bg-surface-2/50" />
        <div className="mt-2 h-2 w-32 rounded bg-surface-2/30" />
      </NodeWrapper>
    </div>
  );
}
