"use client";

import { useDroppable } from "@dnd-kit/core";
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
  mechanicName?: string | null;
  onItemClick?: (workOrder: WorkOrder & { vehicle: Vehicle | null }) => void;
}

export function QueuedVehicleCard({
  workOrder,
  isPending,
  onQuickAssign,
  mechanicName,
  onItemClick,
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
      onClick={() => onItemClick?.(workOrder)}
      className={cn(
        "relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-card p-3.5 pl-3 cursor-pointer active:cursor-grabbing select-none transition-all duration-200 touch-manipulation min-h-[68px]",
        isDragging && "opacity-50 shadow-xl z-50 scale-[1.01]",
        !isDragging && "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
        waitInfo.urgent &&
          "border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/10",
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors",
          waitInfo.urgent ? "bg-amber-500" : "bg-muted-foreground/20",
        )}
      />
      <div
        className={cn(
          "flex items-center justify-center size-10 rounded-lg shrink-0",
          waitInfo.urgent ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted",
        )}
      >
        <Car
          className={cn(
            "size-5",
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
            {mechanicName && (
              <div className="flex items-center gap-1 mt-1">
                <div className="size-1.5 rounded-full bg-primary/40" />
                <span className="text-[11px] text-primary/70 truncate font-medium">
                  {mechanicName}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {workOrder.complaint || `WO ${workOrder.id.slice(0, 8)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("noVehicle")}
            </p>
          </div>
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
            className="group relative flex items-center justify-center size-8 rounded-lg border border-primary/20 bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30 transition-all duration-200 active:scale-90"
            aria-label={t("quickAssign")}
            title={t("assignToFirstBay")}
          >
            <CornerDownRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            <span className="pointer-events-none absolute right-full mr-2 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-lg ring-1 ring-border group-hover:block">
              {t("quickAssign")}
            </span>
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
  mechanics?: { id: string; full_name: string | null }[];
  onItemClick?: (workOrder: WorkOrder & { vehicle: Vehicle | null }) => void;
}

export function WaitingQueue({
  items,
  pendingWoIds = {},
  onQuickAssign,
  mechanics,
  onItemClick,
}: WaitingQueueProps) {
  const { setNodeRef: setQueueDropRef, isOver: isQueueOver } = useDroppable({
    id: "waiting-queue",
  });
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("bayView");

  const mechanicMap = new Map(
    (mechanics ?? []).map((m) => [m.id, m.full_name]),
  );
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
          <span>{t("waitingQueue")}</span>
          {items.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-sm",
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
        <div
          ref={setQueueDropRef}
          className={cn(
            "px-3 pb-3 transition-colors duration-200",
            isQueueOver && "bg-primary/5 rounded-lg",
          )}
        >
          {/* Search input */}
          {items.length > 0 && (
            <div className="relative mb-2 group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 transition-colors duration-200 group-focus-within:text-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("queueSearchPlaceholder")}
                className="w-full h-8 rounded-lg border border-border bg-muted/30 pl-7 pr-7 text-xs shadow-sm transition-all duration-200 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-background focus:shadow-md focus:shadow-primary/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-all duration-200"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {searchQuery.trim() && filtered.length > 0 && (
            <div className="mb-2 flex justify-end">
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <span className="hidden sm:inline">Showing </span>
                {filtered.length}/{items.length}
              </span>
            </div>
          )}

          {items.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/80 bg-gradient-to-br from-muted/40 via-background to-amber-500/5 py-8 gap-3 text-muted-foreground/70">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.12)_1px,transparent_0)] [background-size:14px_14px]" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="flex items-center justify-center size-12 rounded-full bg-background shadow-sm ring-1 ring-border">
                  <Car className="size-6 text-amber-500/80" />
                </div>
                <p className="text-xs font-medium">{t("noVehiclesWaiting")}</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/80 bg-gradient-to-br from-muted/40 via-background to-primary/5 py-8 gap-3 text-muted-foreground/70">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.12)_1px,transparent_0)] [background-size:14px_14px]" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="flex items-center justify-center size-12 rounded-full bg-background shadow-sm ring-1 ring-border">
                  <Search className="size-6 text-primary/70" />
                </div>
                <p className="text-xs font-medium">{t("noMatchSearch")}</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/15 transition-colors"
                >
                  {t("clearSearch")}
                </button>
              </div>
            </div>
          ) : (
            <SortableContext
              items={queueIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {filtered.map((wo) => (
                  <QueuedVehicleCard
                    key={wo.id}
                    workOrder={wo}
                    isPending={!!pendingWoIds[wo.id]}
                    onQuickAssign={onQuickAssign}
                    mechanicName={wo.mechanic_id ? mechanicMap.get(wo.mechanic_id) ?? null : null}
                    onItemClick={onItemClick}
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
