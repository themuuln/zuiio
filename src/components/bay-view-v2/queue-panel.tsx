"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Car, Clock, CornerDownRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { cn, formatPlateNumber } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";

interface QueueItemProps {
  workOrder: WorkOrder & { vehicle: Vehicle | null };
  isPending?: boolean;
  onQuickAssign?: (workOrderId: string) => void;
  mechanicName?: string | null;
  onItemClick?: (workOrder: WorkOrder & { vehicle: Vehicle | null }) => void;
  searchQuery?: string;
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
  searchQuery = "",
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
        "flex items-center gap-2 border border-border/60 bg-card px-3 py-2 cursor-pointer select-none transition-colors touch-manipulation",
        isDragging && "opacity-50 shadow-xl z-50",
        !isDragging && "hover:border-border hover:bg-muted/20",
        waitInfo.urgent &&
          "border-amber-300/60 bg-amber-50/20 dark:bg-amber-950/10",
      )}
    >
      <div className="flex-1 min-w-0">
        {v ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold truncate text-foreground/90">
                <HighlightText
                  text={formatPlateNumber(v.plate_number)}
                  query={searchQuery}
                />
              </span>
              {waitInfo.urgent && (
                <span
                  className={cn(
                    "size-1.5  bg-amber-500 shrink-0",
                    waitInfo.text.includes("h+") && "animate-pulse",
                  )}
                />
              )}
            </div>
            <div className="text-[9px] text-muted-foreground/60 truncate leading-tight">
              <HighlightText text={v.make ?? ""} query={searchQuery} />{" "}
              <HighlightText text={v.model ?? ""} query={searchQuery} />
              {v.year ? ` · ${v.year}` : ""}
            </div>
            {mechanicName && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="size-1  bg-primary/30 shrink-0" />
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
          <Button
            type="button"
            size="icon-xs"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAssign(workOrder.id);
            }}
            title="Assign to first empty bay"
          >
            <CornerDownRight className="size-2.5" />
          </Button>
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
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  type EnrichedWO = (WorkOrder & { vehicle: Vehicle | null }) & {
    _mechanicName?: string | null;
  };

  const enrichedItems: EnrichedWO[] = useMemo(() => {
    const mm = new Map((mechanics ?? []).map((m) => [m.id, m.full_name]));
    return items.map((wo) => ({
      ...wo,
      _mechanicName: wo.mechanic_id ? (mm.get(wo.mechanic_id) ?? null) : null,
    }));
  }, [items, mechanics]);

  const filtered = useFuzzySearch(enrichedItems, searchQuery, {
    keys: [
      "vehicle.plate_number",
      "vehicle.make",
      "vehicle.model",
      "vehicle.color",
      "_mechanicName",
    ] as (keyof EnrichedWO)[],
    threshold: 0.4,
  });

  return (
    <Card size="sm" className="flex h-full min-h-0 flex-col bg-card/90">
      <CardHeader className="gap-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Waiting Queue</CardTitle>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {items.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-3">
        {items.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, make, model... (⌘K)"
              className="h-8 pl-7 pr-7 text-xs"
            />
            {searchQuery && (
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="absolute right-0.5 top-1/2 size-6 -translate-y-1/2 p-0 text-muted-foreground/50"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
        )}

        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-0 flex-1 flex-col transition-colors",
            isOver && "bg-primary/5 ring-1 ring-primary/10",
          )}
        >
          {items.length === 0 ? (
            <Empty className="border border-dashed border-border/60 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Car className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No vehicles waiting</EmptyTitle>
                <EmptyDescription>
                  New work orders will appear here before they are assigned to a
                  bay.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : filtered.length === 0 ? (
            <Empty className="border border-dashed border-border/60 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No match</EmptyTitle>
                <EmptyDescription>
                  Try another plate, make, model, or clear the current search.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                size="sm"
                variant="link"
                onClick={() => setSearchQuery("")}
                className="h-auto text-xs"
              >
                Clear search
              </Button>
            </Empty>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <SortableContext
                items={filtered.map((wo) => `vehicle-${wo.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1.5 pr-2">
                  {filtered.map((wo) => (
                    <QueueItem
                      key={wo.id}
                      workOrder={wo}
                      isPending={!!pendingWoIds[wo.id]}
                      onQuickAssign={onQuickAssign}
                      mechanicName={wo._mechanicName ?? null}
                      onItemClick={onItemClick}
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              </SortableContext>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
