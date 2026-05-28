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
import type { Vehicle, WorkOrder } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPlateNumber } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

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

  const isOverdue = waitInfo.urgent && waitInfo.text.includes("h+");

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onItemClick?.(workOrder)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onItemClick?.(workOrder); }}
      className={cn(
        "relative flex items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 cursor-pointer active:cursor-grabbing select-none transition-all duration-200 touch-manipulation animate-[scale-in_0.25s_ease-out]",
        isDragging && "opacity-50 shadow-xl z-50 scale-[1.01]",
        !isDragging && "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
        waitInfo.urgent &&
          "border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/10",
        isOverdue &&
          "animate-[urgent-flash_2s_ease-in-out_infinite]",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center size-8 rounded-md shrink-0 mt-0.5",
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
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-semibold truncate",
                  waitInfo.urgent && "text-amber-700 dark:text-amber-300",
                )}
              >
                {formatPlateNumber(v.plate_number)}
              </span>
              {waitInfo.urgent && (
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
            </div>
            <div className="text-[11px] text-muted-foreground/70 truncate">
              {v.make} {v.model}
              {v.year ? ` · ${v.year}` : ""}
            </div>
            {mechanicName && (
              <div className="flex items-center gap-1 mt-1">
                <span className="size-1 rounded-full bg-primary/40 shrink-0" />
                <span className="text-[10px] text-primary/70 truncate font-medium">
                  {mechanicName}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="min-w-0">
            <Typography.Text className="truncate text-xs font-medium">
              {workOrder.complaint || `WO ${workOrder.id.slice(0, 8)}`}
            </Typography.Text>
            <Typography.Muted className="text-[11px] text-muted-foreground">
              {t("noVehicle")}
            </Typography.Muted>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5 shrink-0">
        {isPending && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground/50" />
        )}
        {onQuickAssign && !isPending && (
          <Button
            variant="default"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAssign(workOrder.id);
            }}
            className="size-7"
            aria-label={t("quickAssign")}
            title={t("assignToFirstBay")}
          >
            <CornerDownRight className="size-3.5" />
          </Button>
        )}
        <div
          className={cn(
            "flex items-center gap-0.5 text-[10px] font-medium whitespace-nowrap",
            waitInfo.urgent ? "text-amber-600" : "text-muted-foreground/50",
          )}
        >
          <Clock className="size-2.5" />
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

const EMPTY_RECORD: Record<string, boolean> = {};

export function WaitingQueue({
  items,
  pendingWoIds = EMPTY_RECORD,
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
    <div className="overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full justify-between px-2 py-1.5 h-auto text-xs font-semibold"
      >
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-amber-500" />
          <span>{t("waitingQueue")}</span>
          {items.length > 0 && (
            <Badge variant="outline">
              {items.length}
            </Badge>
          )}
        </span>
        {collapsed ? (
          <ChevronUp className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )}
      </Button>

      {!collapsed && (
        <div
          ref={setQueueDropRef}
          className={cn(
            "px-1.5 pb-1.5 transition-colors duration-200",
            isQueueOver && "bg-primary/5 rounded-lg",
          )}
        >
          {/* Search input */}
          {items.length > 0 && (
            <div className="relative mb-2 group">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("queueSearchPlaceholder")}
                className="w-full h-7 rounded-md border border-border bg-muted/30 pl-6 pr-6 text-[10px] transition-colors placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-background"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5"
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          )}

          {searchQuery.trim() && filtered.length > 0 && (
            <div className="mb-2 flex justify-end">
              <Badge variant="secondary">
                <span className="hidden sm:inline">Showing </span>
                {filtered.length}/{items.length}
              </Badge>
            </div>
          )}

          {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 gap-1.5 text-muted-foreground/70">
              <Car className="size-4 text-amber-500/60" />
              <Typography.Text className="text-[11px] font-medium">{t("noVehiclesWaiting")}</Typography.Text>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 gap-1.5 text-muted-foreground/70">
              <Search className="size-5 text-primary/60" />
              <Typography.Text className="text-[11px] font-medium">{t("noMatchSearch")}</Typography.Text>
              <Button
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="px-2 py-0.5 text-[10px] font-medium h-auto"
              >
                {t("clearSearch")}
              </Button>
            </div>
          ) : (
            <SortableContext
              items={queueIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
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
