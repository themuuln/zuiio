"use client";

import { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CardCarouselData } from "@/types/flow";
import { useUiStore } from "@/store/uiStore";
import { getPreviewStats } from "@/lib/nodeStats";
import { PreviewStatsNode } from "./PreviewStatsNode";

export function CardCarouselNode({ id, data, selected }: NodeProps) {
  const d = data as CardCarouselData;
  const [activeIndex, setActiveIndex] = useState(0);
  const previewMode = useUiStore((s) => s.previewMode);
  const stats = getPreviewStats(id, d.stats);
  const cards = d.cards ?? [];
  const card = cards[activeIndex];

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((i) => Math.max(0, i - 1));
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((i) => Math.min(cards.length - 1, i + 1));
  };

  return (
    <div
      className={`min-w-[200px] max-w-[260px] bg-surface border rounded-xl overflow-hidden transition-all text-[13px] ${
        selected ? "border-accent shadow-[0_0_0_2px_rgba(99,102,241,0.25)]" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Top} id="in" />
      <div className="p-1.5 px-2.5 flex items-center gap-1.5 text-white font-semibold text-[12px]" style={{ background: "#ec4899" }}>
        <span className="text-sm">🎴</span>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{d.label}</span>
        <span className="ml-auto bg-white/20 px-1.5 rounded-lg text-[10px] font-bold">{cards.length}</span>
      </div>

      {card ? (
        <div className="flex flex-col">
          {previewMode ? <div className="px-2.5"><PreviewStatsNode stats={stats} /></div> : null}
          {card.imageUrl ? (
            <div className="h-20 overflow-hidden bg-surface-2 flex items-center justify-center">
              <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-20 overflow-hidden bg-surface-2 flex items-center justify-center text-2xl text-text-muted">
              <span>🖼</span>
            </div>
          )}
          <div className="p-2 px-2.5">
            <p className="m-0 text-[12px] font-semibold text-text whitespace-nowrap overflow-hidden text-ellipsis">{card.title || "Card title"}</p>
            <p className="m-0.5 mt-0 text-[11px] text-text-muted leading-tight line-clamp-2 overflow-hidden">
              {card.subtitle || "Card description"}
            </p>
          </div>
          {card.buttons && card.buttons.length > 0 && (
            <div className="flex flex-col border-t border-border">
              {card.buttons.map((btn) => (
                <div key={btn.id} className="relative border-b border-border last:border-b-0">
                  <span className="block p-1.5 px-2.5 text-[11px] font-semibold text-accent text-center cursor-default">
                    {btn.text}
                  </span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`card-${card.id}-button-${btn.id}`}
                    style={{ top: "50%", right: 2, transform: "translateY(-50%)" }}
                  />
                </div>
              ))}
            </div>
          )}
          {cards.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 p-1 border-t border-border">
              <button
                className="bg-none border-none text-text-muted text-base cursor-pointer p-0 px-1 leading-none rounded hover:text-text hover:bg-surface-2 disabled:opacity-30 disabled:cursor-default"
                onClick={goPrev}
                disabled={activeIndex === 0}
              >
                ‹
              </button>
              <div className="flex gap-1 items-center">
                {cards.map((c, i) => (
                  <span
                    key={c.id}
                    className={`w-1 h-1 rounded-full transition-colors ${i === activeIndex ? "bg-accent" : "bg-border"}`}
                  />
                ))}
              </div>
              <button
                className="bg-none border-none text-text-muted text-base cursor-pointer p-0 px-1 leading-none rounded hover:text-text hover:bg-surface-2 disabled:opacity-30 disabled:cursor-default"
                onClick={goNext}
                disabled={activeIndex === cards.length - 1}
              >
                ›
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-2 px-2.5">
          <p className="m-0 text-[12px] text-text-muted leading-snug break-words">No cards added</p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
