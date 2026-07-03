"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CondensedQueueItem } from "./_condensed-queue-item";
import { ALL_STATUSES, STATUS_COLUMN } from "./_constants";
import { ErrorSection } from "./_error-section";
import { BayCard } from "./bay-card";

// ── KanbanDropColumn (moved from _types.tsx) ───────────────────

export function KanbanDropColumn({
  status,
  children,
  className,
}: {
  status: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `kanban-status-${encodeURIComponent(status)}`,
  });

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`${status} column`}
      className={cn(
        "transition-colors duration-200 rounded-xl",
        isOver && "bg-primary/5 ring-1 ring-primary/20",
        className,
      )}
    >
      {children}
    </div>
  );
}

const STATUS_COLUMNS = ALL_STATUSES.filter(
  (s) => s !== "Completed" && s !== "Cancelled",
);

interface KanbanViewProps {
  searchedBays: BaySlotData[];
  assignableBays: BaySlotData[];
  queue: (WorkOrder & { vehicle: Vehicle | null })[];
  pendingWoIds: Record<string, boolean>;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  onAssignClick: (bayNumber: number) => void;
  onNoEmptyBays: () => void;
  onQueueItemClick: (wo: WorkOrder & { vehicle: Vehicle | null }) => void;
  onRemoveHelper: (woId: string, mechId: string) => Promise<void>;
  onPauseTimer?: (woId: string) => void;
  onAddNote?: (woId: string) => void;
  onQuickAddService?: (woId: string) => void;
  onQuickAddParts?: (woId: string) => void;
  orgId?: string | null;
  t: (key: string) => string;
}

export const KanbanView = React.memo(function KanbanView({
  searchedBays,
  assignableBays,
  queue,
  pendingWoIds,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  onAssignClick,
  onNoEmptyBays,
  onQueueItemClick,
  onRemoveHelper,
  onPauseTimer,
  onAddNote,
  onQuickAddService,
  onQuickAddParts,
  orgId,
  t,
}: KanbanViewProps) {
  function handleFindEmptyBay() {
    const emptyBay = assignableBays.find((b) => !b.workOrder);
    if (emptyBay) {
      onAssignClick(emptyBay.bayNumber);
    } else {
      onNoEmptyBays();
    }
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto overflow-y-hidden p-4 w-full">
      {/* Kanban Column: Vacant Bays */}
      <div className="flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col gap-4 bg-card/85 rounded-xl py-3 border border-border/50">
        <div className="flex flex-row items-center justify-between gap-2 border-b border-border/40 px-4 pb-2.5 select-none">
          <div className="font-heading text-xs uppercase tracking-wider font-bold text-muted-foreground">
            {t("available")}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={handleFindEmptyBay}
              className="size-5 rounded hover:bg-muted text-muted-foreground/80 hover:text-foreground cursor-pointer"
              title={t("assignVehicleToBay")}
            >
              <Plus className="size-3" />
            </Button>
            <Badge
              variant="outline"
              className="font-mono font-bold text-xs rounded-full h-5"
            >
              {queue.length}
            </Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 overflow-y-auto no-scrollbar">
          {queue.map((wo) => (
            <CondensedQueueItem
              key={wo.id}
              workOrder={wo}
              onClick={() => onQueueItemClick(wo)}
            />
          ))}
          {queue.length === 0 && (
            <div className="flex flex-col items-center justify-center border border-dashed border-border/40 bg-muted/10 py-12 rounded-xl text-center p-4 w-full opacity-60">
              <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/45 bg-background mb-2">
                <Plus className="size-4 text-muted-foreground/60" />
              </div>
              <Typography.Muted className="text-xs text-muted-foreground/45 font-semibold">
                {t("emptyBay")}
              </Typography.Muted>
            </div>
          )}
        </div>
      </div>

      {STATUS_COLUMNS.map((status) => {
        const baysWithStatus = searchedBays.filter(
          (b) => b.workOrder?.status === status,
        );

        return (
          <KanbanDropColumn
            key={status}
            status={status}
            className={cn(
              "flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col gap-4 bg-card rounded-xl py-3 border border-border/50",
              STATUS_COLUMN[status] ?? "border-t-primary",
            )}
          >
            <div className="flex flex-row items-center justify-between gap-2 border-b border-border/40 px-4 pb-2.5 select-none">
              <div className="font-heading text-xs uppercase tracking-wider font-bold text-foreground/80">
                {status}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={handleFindEmptyBay}
                  className="size-5 rounded hover:bg-muted text-muted-foreground/80 hover:text-foreground cursor-pointer"
                  title={t("assignVehicleToBay")}
                >
                  <Plus className="size-3" />
                </Button>
                <Badge
                  variant={status === "In Progress" ? "default" : "secondary"}
                  className="font-mono font-bold text-xs rounded-full h-5"
                >
                  {baysWithStatus.length}
                </Badge>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-3 overflow-y-auto no-scrollbar">
              {baysWithStatus.map((bay) => (
                <div key={bay.bayNumber} className="flex flex-col shrink-0">
                  <ErrorSection label={`Bay ${bay.bayNumber}`}>
                    <BayCard
                      bay={bay}
                      isPending={
                        bay.workOrder ? !!pendingWoIds[bay.workOrder.id] : false
                      }
                      isKanbanMode
                      onStatusChange={onStatusChange}
                      onRemoveFromBay={onRemoveFromBay}
                      onOpenDetail={onOpenDetail}
                      onRemoveHelper={onRemoveHelper}
                      onPauseTimer={onPauseTimer}
                      onAddNote={onAddNote}
                      onQuickAddService={onQuickAddService}
                      onQuickAddParts={onQuickAddParts}
                      orgId={orgId}
                    />
                  </ErrorSection>
                </div>
              ))}
              {baysWithStatus.length === 0 && (
                <button
                  type="button"
                  onClick={handleFindEmptyBay}
                  className="flex flex-col items-center justify-center border border-dashed border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-primary/5 py-12 rounded-xl text-center select-none p-4 cursor-pointer group/empty w-full"
                >
                  <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/45 bg-background group-hover/empty:scale-110 group-hover/empty:border-primary/50 group-hover/empty:text-primary transition-all mb-2">
                    <Plus className="size-4 text-muted-foreground/60 group-hover/empty:text-primary" />
                  </div>
                  <Typography.Muted className="text-xs text-muted-foreground/45 font-semibold group-hover/empty:text-primary transition-colors">
                    {t("assignVehicleToBay")}
                  </Typography.Muted>
                </button>
              )}
            </div>
          </KanbanDropColumn>
        );
      })}
    </div>
  );
});
