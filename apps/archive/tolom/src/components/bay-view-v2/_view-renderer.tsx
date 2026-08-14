"use client";

import { Building2 } from "lucide-react";
import React from "react";
import type {
  BaySlotData,
  BayViewWorkOrder,
} from "@/lib/services/bay-view-service";
import type { Vehicle } from "@/lib/types";
import { GridView } from "./_grid-view";
import { KanbanView } from "./_kanban-view";
import { ListView } from "./_list-view";
import type { ViewMode } from "./_types";

interface BranchSection {
  branchId: string;
  branchName: string;
  bayCount: number;
  bays: BaySlotData[];
}

interface BayViewViewsProps {
  viewMode: ViewMode;
  searchedBranchSections: BranchSection[] | undefined;
  searchedBays: BaySlotData[];
  filteredQueue: (BayViewWorkOrder & { vehicle: Vehicle | null })[];
  pendingWoIds: Record<string, boolean>;
  readyWosCount: number;
  batchCompletePending: boolean;
  /** Callbacks */
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay: (woId: string) => void;
  onOpenDetail: (
    woId: string,
    initialAction?: "add-service" | "add-part",
  ) => void;
  onAssignClick: (bayNumber: number) => void;
  onQueueItemClick: (
    wo: BayViewWorkOrder & { vehicle: Vehicle | null },
  ) => void;
  onRemoveHelper: (woId: string, mechId: string) => Promise<void>;
  onAssignMechanic: (woId: string, mechanicId: string) => Promise<void>;
  onRemoveMechanic: (woId: string) => Promise<void>;
  onAddHelper: (woId: string, mechanicId: string) => Promise<void>;
  onReorderMechanics: (
    woId: string,
    orderedMechanicIds: string[],
  ) => Promise<void>;
  orgId?: string | null;
  mechanics: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  t: (key: string) => string;
}

function BranchHeader({ section }: { section: BranchSection }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Building2 className="size-4 text-muted-foreground/60" />
      <span className="text-sm font-semibold text-foreground/80">
        {section.branchName}
      </span>
      <span className="text-xs text-muted-foreground/50 bg-muted/60 px-2 py-0.5 rounded-md font-mono">
        {section.bays.filter((b) => b.workOrder).length}/{section.bayCount} bays
      </span>
    </div>
  );
}

export const BayViewViews = React.memo(function BayViewViews({
  viewMode,
  searchedBranchSections,
  searchedBays,
  filteredQueue,
  pendingWoIds,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  onAssignClick,
  onQueueItemClick,
  onRemoveHelper,
  onAssignMechanic,
  onRemoveMechanic,
  onAddHelper,
  onReorderMechanics,
  orgId,
  mechanics,
  t,
}: BayViewViewsProps) {
  // ── Grid view ──
  if (viewMode === "grid") {
    if (searchedBranchSections) {
      return (
        <div className="flex-1 h-full min-h-0 overflow-y-auto p-4">
          {searchedBranchSections.map((section) => (
            <div
              key={section.branchId}
              className={
                searchedBranchSections.length === 1
                  ? "h-full min-h-0"
                  : "mb-6 last:mb-0"
              }
            >
              {searchedBranchSections.length > 1 && (
                <BranchHeader section={section} />
              )}
              <GridView
                bays={section.bays}
                pendingWoIds={pendingWoIds}
                onStatusChange={onStatusChange}
                onRemoveFromBay={onRemoveFromBay}
                onOpenDetail={onOpenDetail}
                onAssignClick={onAssignClick}
                onRemoveHelper={onRemoveHelper}
                orgId={orgId}
                mechanics={mechanics}
                onAssignMechanic={onAssignMechanic}
                onRemoveMechanic={onRemoveMechanic}
                onAddHelper={onAddHelper}
                onReorderMechanics={onReorderMechanics}
              />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex-1 h-full overflow-y-auto p-4">
        <GridView
          bays={searchedBays}
          pendingWoIds={pendingWoIds}
          onStatusChange={onStatusChange}
          onRemoveFromBay={onRemoveFromBay}
          onOpenDetail={onOpenDetail}
          onAssignClick={onAssignClick}
          onRemoveHelper={onRemoveHelper}
          orgId={orgId}
          mechanics={mechanics}
          onAssignMechanic={onAssignMechanic}
          onRemoveMechanic={onRemoveMechanic}
          onAddHelper={onAddHelper}
          onReorderMechanics={onReorderMechanics}
        />
      </div>
    );
  }

  // ── Kanban view ──
  if (viewMode === "kanban") {
    if (searchedBranchSections) {
      return (
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4">
          {searchedBranchSections.map((section) => (
            <div key={section.branchId} className="mb-6 last:mb-0">
              {searchedBranchSections.length > 1 && (
                <BranchHeader section={section} />
              )}
              <KanbanView
                searchedBays={section.bays}
                assignableBays={section.bays}
                queue={filteredQueue}
                pendingWoIds={pendingWoIds}
                onStatusChange={onStatusChange}
                onRemoveFromBay={onRemoveFromBay}
                onOpenDetail={onOpenDetail}
                onAssignClick={onAssignClick}
                onNoEmptyBays={() => {}}
                onQueueItemClick={onQueueItemClick}
                onRemoveHelper={onRemoveHelper}
                t={t}
                orgId={orgId}
              />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4">
        <KanbanView
          searchedBays={searchedBays}
          assignableBays={[]}
          queue={filteredQueue}
          pendingWoIds={pendingWoIds}
          onStatusChange={onStatusChange}
          onRemoveFromBay={onRemoveFromBay}
          onOpenDetail={onOpenDetail}
          onAssignClick={onAssignClick}
          onNoEmptyBays={() => {}}
          onQueueItemClick={onQueueItemClick}
          onRemoveHelper={onRemoveHelper}
          t={t}
          orgId={orgId}
        />
      </div>
    );
  }

  // ── List view ──
  if (searchedBranchSections) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {searchedBranchSections.map((section) => (
          <div key={section.branchId} className="mb-6 last:mb-0">
            {searchedBranchSections.length > 1 && (
              <BranchHeader section={section} />
            )}
            <ListView
              bays={section.bays}
              onOpenDetail={onOpenDetail}
              onAssignClick={onAssignClick}
              orgId={orgId}
              t={t}
            />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4">
      <ListView
        bays={searchedBays}
        onOpenDetail={onOpenDetail}
        onAssignClick={onAssignClick}
        orgId={orgId}
        t={t}
      />
    </div>
  );
});
