"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { NoteData } from "@/types/flow";
import { NodeWrapper } from "./NodeWrapper";

const NOTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  yellow: { bg: "#3a3510", border: "#5c5220", text: "#e8d44d" },
  green: { bg: "#143d1a", border: "#22662c", text: "#4ade80" },
  blue: { bg: "#14324d", border: "#1f5480", text: "#60a5fa" },
  pink: { bg: "#4d1435", border: "#802060", text: "#f472b6" },
};

export const NoteNode = memo(function NoteNode({ data, selected }: NodeProps) {
  const d = data as NoteData;
  const colors = NOTE_COLORS[d.color ?? "yellow"];

  return (
    <NodeWrapper
      selected={selected}
      color={colors.text}
      icon="📌"
      label={d.label}
      isNote
      noteColors={colors}
    >
      <p className="m-0 text-xs leading-relaxed whitespace-pre-wrap" style={{ color: colors.text, opacity: 0.85 }}>
        {d.text || "Write your note here..."}
      </p>
    </NodeWrapper>
  );
});
