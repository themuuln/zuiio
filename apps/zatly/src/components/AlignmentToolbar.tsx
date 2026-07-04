"use client";

import { useCallback } from "react";
import { useFlowStore } from "@/store/flowStore";

export function AlignmentToolbar() {
  const selectedNodes = useFlowStore((s) => {
    const sel = s.nodes.filter((n) => n.selected);
    return sel.length > 0 ? sel : null;
  });
  const setNodePositions = useFlowStore((s) => s.setNodePositions);

  const align = useCallback(
    (direction: "left" | "centerX" | "right" | "top" | "centerY" | "bottom") => {
      const nodes = useFlowStore.getState().nodes.filter((n) => n.selected);
      if (nodes.length < 2) return;
      const target = nodes[0];
      const positions: Record<string, { x: number; y: number }> = {};
      for (const node of nodes) {
        let x = node.position.x;
        let y = node.position.y;
        switch (direction) {
          case "left": x = target.position.x; break;
          case "centerX": x = target.position.x + (target.measured?.width ?? 180) / 2 - (node.measured?.width ?? 180) / 2; break;
          case "right": x = target.position.x + (target.measured?.width ?? 180) - (node.measured?.width ?? 180); break;
          case "top": y = target.position.y; break;
          case "centerY": y = target.position.y + (target.measured?.height ?? 80) / 2 - (node.measured?.height ?? 80) / 2; break;
          case "bottom": y = target.position.y + (target.measured?.height ?? 80) - (node.measured?.height ?? 80); break;
        }
        positions[node.id] = { x, y };
      }
      setNodePositions(positions);
    },
    [setNodePositions]
  );

  const distribute = useCallback(
    (axis: "horizontal" | "vertical") => {
      const nodes = useFlowStore.getState().nodes.filter((n) => n.selected);
      if (nodes.length < 3) return;
      const sorted = [...nodes].sort((a, b) =>
        axis === "horizontal" ? a.position.x - b.position.x : a.position.y - b.position.y
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpace =
        axis === "horizontal"
          ? last.position.x - first.position.x
          : last.position.y - first.position.y;
      const gap = totalSpace / (sorted.length - 1);
      const positions: Record<string, { x: number; y: number }> = {};
      sorted.forEach((node, i) => {
        const pos =
          axis === "horizontal"
            ? first.position.x + gap * i
            : first.position.y + gap * i;
        positions[node.id] = {
          x: axis === "horizontal" ? pos : node.position.x,
          y: axis === "vertical" ? pos : node.position.y,
        };
      });
      setNodePositions(positions);
    },
    [setNodePositions]
  );

  if (!selectedNodes || selectedNodes.length < 2) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-xl border border-border bg-surface/95 px-2 py-1.5 shadow-2xl animate-[fadeScaleIn_0.12s_ease-out]">
      <span className="text-[10px] text-text-muted mr-1 font-medium">{selectedNodes.length} selected</span>
      <span className="w-px h-5 bg-border" />
      <button className="h-7 px-2 rounded-lg text-[11px] text-text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors font-medium" onClick={() => align("left")} title="Align left">⬇</button>
      <button className="h-7 px-2 rounded-lg text-[11px] text-text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors font-medium" onClick={() => align("centerX")} title="Align center horizontally">⬇</button>
      <button className="h-7 px-2 rounded-lg text-[11px] text-text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors font-medium" onClick={() => align("right")} title="Align right">⬇</button>
      <span className="w-px h-5 bg-border" />
      <button className="h-7 px-2 rounded-lg text-[11px] text-text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors font-medium" onClick={() => align("top")} title="Align top">➡</button>
      <button className="h-7 px-2 rounded-lg text-[11px] text-text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors font-medium" onClick={() => align("centerY")} title="Align center vertically">➡</button>
      <button className="h-7 px-2 rounded-lg text-[11px] text-text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors font-medium" onClick={() => align("bottom")} title="Align bottom">➡</button>
      {selectedNodes.length >= 3 && (
        <>
          <span className="w-px h-5 bg-border" />
          <button className="h-7 px-2 rounded-lg text-[11px] text-text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors font-medium" onClick={() => distribute("horizontal")} title="Distribute horizontally">↔</button>
          <button className="h-7 px-2 rounded-lg text-[11px] text-text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors font-medium" onClick={() => distribute("vertical")} title="Distribute vertically">↕</button>
        </>
      )}
    </div>
  );
}
