"use client";

import { useDroppable } from "@dnd-kit/core";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragCompareZoneProps {
  /** Player IDs collected for comparison */
  players: string[];
  /** Whether a drag is in progress */
  isDragging: boolean;
}

export function DragCompareZone({ players, isDragging }: DragCompareZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: "compare-zone" });

  if (!isDragging) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl border-2 border-dashed p-4 shadow-2xl transition-all duration-200",
        isOver
          ? "border-[var(--brand-sports)] bg-[var(--brand-sports)]/10 scale-105"
          : "border-muted-foreground/30 bg-background/95 backdrop-blur-sm",
      )}
    >
      <ArrowLeftRight className="size-6 text-[var(--brand-sports)]" />
      <div className="text-sm">
        <p className="font-semibold">
          {players.length === 0
            ? "Тоглогчийг энд оруулна уу"
            : `${players.length} тоглогч сонгогдлоо`}
        </p>
        <p className="text-muted-foreground">
          {players.length < 2
            ? "Нэмж нэг тоглогч сонгоно уу"
            : "Харьцуулахын тулд оруулна уу"}
        </p>
      </div>
    </div>
  );
}
