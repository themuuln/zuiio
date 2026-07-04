"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { AiReplyData } from "@/types/flow";
import { NodeWrapper } from "./NodeWrapper";
import { getHandleStyle } from "./HandleColors";

export const AiReplyNode = memo(function AiReplyNode({ data, selected }: NodeProps) {
  const d = data as AiReplyData;
  const promptPreview =
    d.systemPrompt && d.systemPrompt.length > 50
      ? `${d.systemPrompt.slice(0, 50)}...`
      : d.systemPrompt || "No prompt set";

  return (
    <NodeWrapper selected={selected} color="#a855f7" icon="🤖" label={d.label}>
      <Handle type="target" position={Position.Top} id="in" style={getHandleStyle("standard")} />
      <p className="m-0 text-[12px] text-text-muted leading-snug break-words">
        {promptPreview}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-muted">
        <span className="px-1.5 py-0.5 rounded-full border border-border bg-surface-2 font-medium">
          {d.model || "deepseek-v4-flash"}
        </span>
        <span>ctx: {d.contextSize ?? 5}</span>
        <span>temp: {d.temperature ?? 0.7}</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="out" style={getHandleStyle("standard")} />
    </NodeWrapper>
  );
});
