"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Car, Clock, CornerDownRight, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { Vehicle, WorkOrder } from "@/lib/database.types";
import { cn, formatPlateNumber } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QueueItemProps {
  workOrder: WorkOrder & { vehicle: Vehicle | null };
  isPending?: boolean;
  onQuickAssign?: (workOrderId: string) => void;
  mechanicName?: string | null;
  onItemClick?: (workOrder: WorkOrder & { vehicle: Vehicle | null }) => void;
}

function getWaitTime(createdAt: string): { text: string; urgent: boolean } {
  const minutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60000,
  );
  if (minutes < 15) return { text: `${minutes}m`, urgent: false };
  if (minutes < 60) return { text: `${minutes}m`, urgent: minutes > 30 };
  const hours = Math.floor(minutes / 60);
  return { text: `${hours}h+`, urgent: true };
}

function QueueItem({
  workOrder,
  isPending,
  onQuickAssign,
  mechanicName,
  onItemClick,
}: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `vehicle-${workOrder.id}`,
    data: { type: "vehicle", workOrderId: workOrder.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const v = workOrder.vehicle;
  const [waitInfo, setWaitInfo] = useState(() =>
    getWaitTime(workOrder.created_at),
  );

  useEffect(() => {
    const ref = new Date(workOrder.created_at).getTime();
    const tick = () => {
      const minutes = Math.floor((Date.now() - ref) / 60000);
      if (minutes < 15) setWaitInfo({ text: `${minutes}m`, urgent: false });
      else if (minutes < 60)
        setWaitInfo({ text: `${minutes}m`, urgent: minutes > 30 });
      else setWaitInfo({ text: `${Math.floor(minutes / 60)}h+`, urgent: true });
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [workOrder.created_at]);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onItemClick?.(workOrder)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onItemClick?.(workOrder);
      }}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border/60 bg-card px-2 py-1.5 cursor-pointer select-none transition-colors touch-manipulation",
        isDragging && "opacity-50 shadow-xl z-50",
        !isDragging && "hover:border-border hover:bg-muted/20",
        waitInfo.urgent && "border-amber-300/60 bg-amber-50/20 dark:bg-amber-950/10",
      )}
    >
      <div className="flex-1 min-w-0">
        {v ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold truncate text-foreground/90">
                {formatPlateNumber(v.plate_number)}
              </span>
              {waitInfo.urgent && (
                <span className={cn("size-1.5 rounded-full bg-amber-500 shrink-0", waitInfo.text.includes("h+") && "animate-pulse")} />
              )}
            </div>
            <div className="text-[9px] text-muted-foreground/60 truncate leading-tight">
              {v.make} {v.model}
              {v.year ? ` · ${v.year}` : ""}
            </div>
            {mechanicName && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="size-1 rounded-full bg-primary/30 shrink-0" />
                <span className="text-[9px] text-primary/60 truncate font-medium">
                  {mechanicName}
                </span>
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="text-[11px] font-medium truncate">
              {workOrder.complaint || `WO ${workOrder.id.slice(0, 8)}`}
            </p>
            <p className="text-[9px] text-muted-foreground">No vehicle</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        {onQuickAssign && !isPending && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAssign(workOrder.id);
            }}
            className="flex items-center justify-center size-5 rounded border border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Assign to first empty bay"
          >
            <CornerDownRight className="size-2.5" />
          </button>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[9px] font-medium whitespace-nowrap",
            waitInfo.urgent ? "text-amber-600" : "text-muted-foreground/40",
          )}
        >
          <Clock className="size-2" />
          {waitInfo.text}
        </span>
      </div>
    </div>
  );
}

interface QueuePanelProps {
  items: (WorkOrder & { vehicle: Vehicle | null })[];
  pendingWoIds?: Record<string, boolean>;
  onQuickAssign?: (workOrderId: string) => void;
  mechanics?: { id: string; full_name: string | null }[];
  onItemClick?: (workOrder: WorkOrder & { vehicle: Vehicle | null }) => void;
}

const EMPTY_RECORD: Record<string, boolean> = {};

export function QueuePanel({
  items,
  pendingWoIds = EMPTY_RECORD,
  onQuickAssign,
  mechanics,
  onItemClick,
}: QueuePanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "waiting-queue" });
  const [searchQuery, setSearchQuery] = useState("");

  const mechanicMap = new Map(
    (mechanics ?? []).map((m) => [m.id, m.full_name]),
  );

  const filtered = searchQuery.trim()
    ? items.filter((wo) => {
        const q = searchQuery.toLowerCase();
        const v = wo.vehicle;
        const mechName = wo.mechanic_id ? mechanicMap.get(wo.mechanic_id) : null;
        return (
          v?.plate_number?.toLowerCase().includes(q) ||
          v?.make?.toLowerCase().includes(q) ||
          v?.model?.toLowerCase().includes(q) ||
          v?.color?.toLowerCase().includes(q) ||
          mechName?.toLowerCase().includes(q)
        );
      })
    : items;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground/80">Waiting Queue</span>
          {items.length > 0 && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-medium">
              {items.length}
            </Badge>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plate, make, model..."
            className="h-8 pl-7 pr-7 text-xs"
          />
          {searchQuery && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSearchQuery("")}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 size-6 p-0 text-muted-foreground/50"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      )}

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-1 rounded-lg transition-colors min-h-0",
          isOver && "bg-primary/5 ring-1 ring-primary/10",
        )}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground/60">
            <Car className="size-4 mb-0.5" />
            <p className="text-xs">No vehicles waiting</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground/60">
            <Search className="size-5 mb-1" />
            <p className="text-xs">No match</p>
            <Button
              size="sm"
              variant="link"
              onClick={() => setSearchQuery("")}
              className="h-auto text-xs"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[260px]">
            <SortableContext items={filtered.map((wo) => `vehicle-${wo.id}`)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-0.5 pr-2">
                {filtered.map((wo) => (
                  <QueueItem
                    key={wo.id}
                    workOrder={wo}
                    isPending={!!pendingWoIds[wo.id]}
                    onQuickAssign={onQuickAssign}
                    mechanicName={
                      wo.mechanic_id
                        ? mechanicMap.get(wo.mechanic_id) ?? null
                        : null
                    }
                    onItemClick={onItemClick}
                  />
                ))}
              </div>
            </SortableContext>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
