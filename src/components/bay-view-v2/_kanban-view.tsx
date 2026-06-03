"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CondensedQueueItem } from "./_condensed-queue-item";
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

// ── KanbanView ─────────────────────────────────────────────────

const STATUS_COLUMNS = ["New", "Diagnosing", "In Progress", "Ready for Pickup"];

const COLUMN_COLORS: Record<string, string> = {
  New: "border-t-amber-400 bg-amber-400/5",
  Diagnosing: "border-t-blue-400 bg-blue-400/5",
  "In Progress": "border-t-indigo-500 bg-indigo-500/5",
  "Ready for Pickup": "border-t-emerald-500 bg-emerald-500/5",
};

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
  t: (key: string) => string;
}

export function KanbanView({
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
      <div className="flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col gap-3.5 bg-card/85 backdrop-blur-sm rounded-xl py-3 border border-border/50 border-t-4 border-t-slate-300 dark:border-t-slate-800 shadow-sm">
        <div className="flex flex-row items-center justify-between gap-2 border-b border-border/40 px-4 pb-2.5 select-none">
          <div className="font-heading text-xs uppercase tracking-wider font-bold text-muted-foreground">
            {t("available")}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={handleFindEmptyBay}
              className="size-5 rounded hover:bg-muted text-muted-foreground/80 hover:text-foreground cursor-pointer"
              title="Assign vehicle to an empty bay"
            >
              <Plus className="size-3" />
            </Button>
            <Badge
              variant="outline"
              className="font-mono font-bold text-[10px] rounded-full h-5"
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
              <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/45 bg-background mb-2 shadow-sm">
                <Plus className="size-3.5 text-muted-foreground/60" />
              </div>
              <Typography.Muted className="text-[10px] text-muted-foreground/45 font-semibold">
                No Vacant Bays
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
              "flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col gap-3.5 bg-card/85 backdrop-blur-sm rounded-xl py-3 border border-border/50 border-t-4 shadow-sm",
              COLUMN_COLORS[status] ?? "border-t-primary",
            )}
          >
            <div className="flex flex-row items-center justify-between gap-2 border-b border-border/40 px-4 pb-2.5 select-none">
              <div className="font-heading text-xs uppercase tracking-wider font-bold text-foreground/80">
                {status}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={handleFindEmptyBay}
                  className="size-5 rounded hover:bg-muted text-muted-foreground/80 hover:text-foreground cursor-pointer"
                  title="Assign vehicle to an empty bay"
                >
                  <Plus className="size-3" />
                </Button>
                <Badge
                  variant={status === "In Progress" ? "default" : "secondary"}
                  className="font-mono font-bold text-[10px] rounded-full h-5"
                >
                  {baysWithStatus.length}
                </Badge>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-3 overflow-y-auto no-scrollbar">
              {baysWithStatus.map((bay) => (
                <div key={bay.bayNumber} className="flex flex-col shrink-0">
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
                  />
                </div>
              ))}
              {baysWithStatus.length === 0 && (
                <button
                  type="button"
                  onClick={handleFindEmptyBay}
                  className="flex flex-col items-center justify-center border border-dashed border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-primary/5 py-12 rounded-xl text-center select-none p-4 cursor-pointer group/empty w-full"
                >
                  <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/45 bg-background group-hover/empty:scale-110 group-hover/empty:border-primary/50 group-hover/empty:text-primary transition-all mb-2 shadow-sm">
                    <Plus className="size-3.5 text-muted-foreground/60 group-hover/empty:text-primary" />
                  </div>
                  <Typography.Muted className="text-[10px] text-muted-foreground/45 font-semibold group-hover/empty:text-primary transition-colors">
                    Assign Vehicle
                  </Typography.Muted>
                </button>
              )}
            </div>
          </KanbanDropColumn>
        );
      })}
    </div>
  );
}
