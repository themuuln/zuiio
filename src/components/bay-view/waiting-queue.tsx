"use client";

import { useDraggable } from "@dnd-kit/core";
import { Car, ChevronDown, ChevronUp, Clock } from "lucide-react";
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
}

export function QueuedVehicleCard({ workOrder }: QueuedVehicleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `vehicle-${workOrder.id}`,
      data: { type: "vehicle", workOrderId: workOrder.id },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

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
      else if (minutes < 60) setWaitInfo({ text: `${minutes}m`, urgent: minutes > 30 });
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
        isDragging && "opacity-50 shadow-xl",
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
          <div className="text-sm text-muted-foreground">No vehicle</div>
        )}
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-xs font-medium shrink-0",
          waitInfo.urgent ? "text-amber-600" : "text-muted-foreground/50",
        )}
      >
        <Clock className="size-3" />
        {waitInfo.text}
      </div>
    </div>
  );
}

// ── Waiting Queue Panel ─────────────────────────────────

interface WaitingQueueProps {
  items: (WorkOrder & { vehicle: Vehicle | null })[];
}

export function WaitingQueue({ items }: WaitingQueueProps) {
  const [collapsed, setCollapsed] = useState(false);

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
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground/50">
              <Car className="size-6" />
              <p className="text-xs">No vehicles waiting</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
              {items.map((wo) => (
                <QueuedVehicleCard key={wo.id} workOrder={wo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
