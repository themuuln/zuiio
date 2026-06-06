"use client";

import { useEffect, useMemo, useState } from "react";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { BayCard } from "./bay-card";

interface GridViewProps {
  bays: BaySlotData[];
  pendingWoIds: Record<string, boolean>;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  onAssignClick: (bayNumber: number) => void;
  onRemoveHelper: (woId: string, mechId: string) => Promise<void>;
  onPauseTimer?: (woId: string) => void;
  onAddNote?: (woId: string) => void;
  onQuickAddService?: (woId: string) => void;
  onQuickAddParts?: (woId: string) => void;
  orgId?: string | null;
}

/**
 * Pick column count that packs bay cards into the fewest rows
 * while keeping each card at least minCardWidth wide.
 */
function optimalColumns(
  bayCount: number,
  containerWidth: number,
  minCardWidth: number,
): number {
  if (bayCount === 0) return 1;
  const maxCols = Math.max(1, Math.floor(containerWidth / minCardWidth));
  // find the column count in [1..maxCols] that minimises row count
  let bestCols = 1;
  let bestRows = bayCount; // 1 col → bayCount rows
  for (let cols = 2; cols <= maxCols; cols++) {
    const rows = Math.ceil(bayCount / cols);
    if (rows < bestRows) {
      bestRows = rows;
      bestCols = cols;
    }
  }
  return bestCols;
}

export function GridView({
  bays,
  pendingWoIds,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  onAssignClick,
  onRemoveHelper,
  onPauseTimer,
  onAddNote,
  onQuickAddService,
  onQuickAddParts,
  orgId,
}: GridViewProps) {
  const bayCount = bays.length;
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cols = useMemo(
    () => optimalColumns(bayCount, windowWidth, 450),
    [bayCount, windowWidth],
  );

  return (
    <div
      className="grid gap-4 w-full [grid-auto-rows:auto]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {bays.map((bay) => (
        <BayCard
          key={bay.bayNumber}
          bay={bay}
          isPending={bay.workOrder ? !!pendingWoIds[bay.workOrder.id] : false}
          isKanbanMode={false}
          onStatusChange={onStatusChange}
          onRemoveFromBay={onRemoveFromBay}
          onOpenDetail={onOpenDetail}
          onAssignClick={onAssignClick}
          onRemoveHelper={onRemoveHelper}
          onPauseTimer={onPauseTimer}
          onAddNote={onAddNote}
          onQuickAddService={onQuickAddService}
          onQuickAddParts={onQuickAddParts}
          orgId={orgId}
        />
      ))}
    </div>
  );
}
