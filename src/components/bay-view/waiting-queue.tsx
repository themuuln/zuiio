"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  CornerDownRight,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { Vehicle, WorkOrder } from "@/lib/database.types";
import { cn } from "@/lib/utils";

function getWaitTime(createdAt: string): { text: string; urgent: boolean } {
  const minutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60000,
  );
  if (minutes < 15) return { text: `${minutes}m`, urgent: false };
  if (minutes < 60) return { text: `${minutes}m`, urgent: minutes > 30 };
  const hours = Math.floor(minutes / 60);
  return { text: `${hours}h+`, urgent: true };
}

interface QueuedVehicleCardProps {
  workOrder: WorkOrder & { vehicle: Vehicle | null };
  isPending?: boolean;
  onQuickAssign?: (workOrderId: string) => void;
}

export function QueuedVehicleCard({
  workOrder,
  isPending,
  onQuickAssign,
}: QueuedVehicleCardProps) {
  const t = useTranslations("bayView");
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
  const createdRef = useRef(new Date(workOrder.created_at).getTime());
  const [waitInfo, setWaitInfo] = useState(() =>
    getWaitTime(workOrder.created_at),
  );

  useEffect(() => {
    createdRef.current = new Date(workOrder.created_at).getTime();
    const tick = () => {
      const minutes = Math.floor((Date.now() - createdRef.current) / 60000);
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
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 cursor-grab active:cursor-grabbing select-none transition-all touch-manipulation",
        isDragging && "opacity-50 shadow-xl z-50",
        !isDragging && "hover:shadow-sm hover:border-primary/30",
        waitInfo.urgent &&
          "border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/10",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center size-8 rounded-lg shrink-0",
          waitInfo.urgent ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted",
        )}
      >
        <Car
          className={cn(
            "size-4",
            waitInfo.urgent ? "text-amber-600" : "text-muted-foreground",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        {v ? (
          <>
            <div className="font-semibold text-sm truncate flex items-center gap-1.5">
              {v.plate_number}
              {waitInfo.urgent && (
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {v.make} {v.model}
              {v.year ? ` · ${v.year}` : ""}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">{t("noVehicle")}</div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isPending && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground/50" />
        )}
        {onQuickAssign && !isPending && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAssign(workOrder.id);
            }}
            className="flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-90"
            aria-label="Quick assign to first available bay"
            title="Assign to first empty bay"
          >
            <CornerDownRight className="size-3.5" />
          </button>
        )}
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            waitInfo.urgent ? "text-amber-600" : "text-muted-foreground/50",
          )}
        >
          <Clock className="size-3" />
          {waitInfo.text}
        </div>
      </div>
    </div>
  );
}

// ── Waiting Queue Panel ─────────────────────────────────

interface WaitingQueueProps {
  items: (WorkOrder & { vehicle: Vehicle | null })[];
  pendingWoIds?: Record<string, boolean>;
  onQuickAssign?: (workOrderId: string) => void;
}

export function WaitingQueue({
  items,
  pendingWoIds = {},
  onQuickAssign,
}: WaitingQueueProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const queueIds = items.map((wo) => `vehicle-${wo.id}`);

  const filtered = searchQuery.trim()
    ? items.filter((wo) => {
        const q = searchQuery.toLowerCase();
        const v = wo.vehicle;
        return (
          v?.plate_number?.toLowerCase().includes(q) ||
          v?.make?.toLowerCase().includes(q) ||
          v?.model?.toLowerCase().includes(q) ||
          v?.color?.toLowerCase().includes(q)
        );
      })
    : items;

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <div className="flex items-center justify-center size-7 rounded-lg bg-amber-500/10">
            <Clock className="size-3.5 text-amber-500" />
          </div>
          <span>Waiting Queue</span>
          {items.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                items.length > 5
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
              )}
            >
              {items.length}
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-3 pb-3">
          {/* Search input */}
          {items.length > 0 && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plate, make, model..."
                className="w-full h-8 rounded-lg border border-border bg-muted/30 pl-8 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground/50">
              <Car className="size-6" />
              <p className="text-xs">No vehicles waiting</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground/50">
              <Search className="size-6" />
              <p className="text-xs">No vehicles match your search</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[10px] text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <SortableContext
              items={queueIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                {filtered.map((wo) => (
                  <QueuedVehicleCard
                    key={wo.id}
                    workOrder={wo}
                    isPending={!!pendingWoIds[wo.id]}
                    onQuickAssign={onQuickAssign}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}
