"use client";

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
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] auto-rows-fr gap-4 overflow-y-auto w-full h-full">
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
