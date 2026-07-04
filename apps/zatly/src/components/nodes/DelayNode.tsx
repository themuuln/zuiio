"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { DelayData } from "@/types/flow";

export function DelayNode({ data, selected }: NodeProps) {
  const d = data as DelayData;
  return (
    <div
      className={`min-w-[180px] max-w-[240px] bg-surface border rounded-xl overflow-hidden transition-all text-[13px] ${
        selected ? "border-accent shadow-[0_0_0_2px_rgba(99,102,241,0.25)]" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Top} id="in" />
      <div className="p-1.5 px-2.5 flex items-center gap-1.5 text-white font-semibold text-[12px]" style={{ background: "#f97316" }}>
        <span className="text-sm">⏱</span>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{d.label}</span>
      </div>
      <div className="p-2 px-2.5">
        <p className="m-0 text-[12px] text-text-muted leading-snug break-words">
          Wait <strong className="text-text">{d.duration}</strong> {d.unit}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
