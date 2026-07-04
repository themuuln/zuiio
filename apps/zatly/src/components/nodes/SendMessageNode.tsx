"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SendMessageData } from "@/types/flow";
import { useUiStore } from "@/store/uiStore";
import { useFlowStore } from "@/store/flowStore";
import { getPreviewStats } from "@/lib/nodeStats";
import { PreviewStatsNode } from "./PreviewStatsNode";

export function SendMessageNode({ id, data, selected }: NodeProps) {
  const d = data as SendMessageData;
  const previewMode = useUiStore((s) => s.previewMode);
  const requestButtonFocus = useUiStore((s) => s.requestButtonFocus);
  const selectNode = useFlowStore((s) => s.selectNode);
  const stats = getPreviewStats(id, d.stats);

  return (
    <div
      className={`min-w-[180px] max-w-[240px] bg-surface border rounded-xl overflow-hidden transition-all text-[13px] ${
        selected ? "border-accent shadow-[0_0_0_2px_rgba(99,102,241,0.25)]" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Top} id="in" />
      <div className="p-1.5 px-2.5 flex items-center gap-1.5 text-white font-semibold text-[12px]" style={{ background: "#3b82f6" }}>
        <span className="text-sm">💬</span>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{d.label}</span>
      </div>
      <div className="p-2 px-2.5">
        {previewMode ? <PreviewStatsNode stats={stats} /> : null}
        <p className="m-0 text-[12px] text-text-muted leading-snug break-words">
          {d.message || "Type a message..."}
        </p>
        {d.buttons && d.buttons.length > 0 && (
          <div className="flex flex-col gap-1 mt-1.5">
            {d.buttons.map((btn) => (
              <div key={btn.id} className="relative">
                <button
                  type="button"
                  className="block w-full text-left p-0.5 px-2 bg-surface-2 border border-border rounded text-[11px] text-text font-medium cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectNode(id);
                    requestButtonFocus(id, btn.id);
                  }}
                >
                  {btn.text}
                </button>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`button-${btn.id}`}
                  style={{ top: "50%", right: 2, transform: "translateY(-50%)" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
