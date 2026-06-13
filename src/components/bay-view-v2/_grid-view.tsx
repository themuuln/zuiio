"use client";

import React from "react";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { ErrorSection } from "./_error-section";
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
  /** Available mechanics for quick assign */
  mechanics?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  /** Called when assigning a mechanic to the work order */
  onAssignMechanic?: (woId: string, mechanicId: string) => Promise<void>;
  /** Called when removing the mechanic from the work order */
  onRemoveMechanic?: (woId: string) => Promise<void>;
  /** Called when adding a helper mechanic */
  onAddHelper?: (woId: string, mechanicId: string) => Promise<void>;
  /** Called when reordering mechanics */
  onReorderMechanics?: (
    woId: string,
    orderedMechanicIds: string[],
  ) => Promise<void>;
}

export const GridView = React.memo(function GridView({
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
  mechanics = [],
  onAssignMechanic,
  onRemoveMechanic,
  onAddHelper,
  onReorderMechanics,
}: GridViewProps) {
  return (
    <div className="grid w-full h-full min-h-0 [grid-auto-rows:1fr] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {bays.map((bay) => (
        <ErrorSection key={bay.bayNumber} label={`Bay ${bay.bayNumber}`}>
          <BayCard
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
            mechanics={mechanics}
            onAssignMechanic={onAssignMechanic}
            onRemoveMechanic={onRemoveMechanic}
            onAddHelper={onAddHelper}
            onReorderMechanics={onReorderMechanics}
          />
        </ErrorSection>
      ))}
    </div>
  );
});
