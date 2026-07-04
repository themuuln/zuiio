"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ConditionData } from "@/types/flow";

const OP_LABELS: Record<string, string> = {
  equals: "=",
  contains: "contains",
  gt: ">",
  lt: "<",
  exists: "exists",
};

export function ConditionNode({ data, selected }: NodeProps) {
  const d = data as ConditionData;
  return (
    <div
      className={`min-w-[180px] max-w-[240px] bg-surface border rounded-xl overflow-hidden transition-all text-[13px] ${
        selected ? "border-accent shadow-[0_0_0_2px_rgba(99,102,241,0.25)]" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Top} id="in" />
      <div className="p-1.5 px-2.5 flex items-center gap-1.5 text-white font-semibold text-[12px]" style={{ background: "#a855f7" }}>
        <span className="text-sm">🔀</span>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{d.label}</span>
      </div>
      <div className="p-2 px-2.5">
        <p className="m-0 text-[12px] text-text-muted leading-snug break-words">
          {d.field ? (
            <>
              <strong className="text-text">{d.field}</strong> {OP_LABELS[d.operator] || d.operator}{" "}
              {d.value && <code className="bg-surface-2 px-1 rounded text-[11px]">{d.value}</code>}
            </>
          ) : (
            "Set a condition..."
          )}
        </p>
      </div>
      <div className="flex border-t border-border">
        <div className="flex-1 text-center py-1 text-[11px] font-bold relative text-green border-r border-border">
          <span>Yes</span>
          <Handle type="source" position={Position.Bottom} id="yes" style={{ left: "30%" }} />
        </div>
        <div className="flex-1 text-center py-1 text-[11px] font-bold relative text-red">
          <span>No</span>
          <Handle type="source" position={Position.Bottom} id="no" style={{ left: "70%" }} />
        </div>
      </div>
    </div>
  );
}
