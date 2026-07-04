"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { StartData } from "@/types/flow";

export function StartNode({ id, data, selected }: NodeProps) {
  const d = data as StartData;
  const trigger = d.trigger ?? "default";
  const keywords = Array.isArray(d.keywords) ? d.keywords.filter(Boolean) : [];

  return (
    <div
      className={`min-w-[180px] max-w-[240px] bg-surface border rounded-xl overflow-hidden transition-all text-[13px] ${
        selected ? "border-accent shadow-[0_0_0_2px_rgba(99,102,241,0.25)]" : "border-border"
      }`}
    >
      <div className="p-1.5 px-2.5 flex items-center gap-1.5 text-white font-semibold text-[12px]" style={{ background: "#22c55e" }}>
        <span className="text-sm">▶</span>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">Start</span>
      </div>
      <div className="p-2 px-2.5">
        <p className="m-0 text-[12px] text-text-muted leading-snug break-words">
          {trigger === "default" ? "Flow begins on any message" : `Trigger: ${trigger}`}
        </p>
        {trigger === "keyword" ? (
          keywords.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {keywords.slice(0, 4).map((keyword) => (
                <span key={keyword} className="px-1.5 py-0.5 rounded-full border border-border bg-surface-2 text-[10px] text-text">
                  {keyword}
                </span>
              ))}
              {keywords.length > 4 ? (
                <span className="px-1.5 py-0.5 rounded-full border border-border bg-surface-2 text-[10px] text-text-muted">
                  +{keywords.length - 4}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="m-0 mt-1 text-[11px] text-text-muted">No keywords set</p>
          )
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
