"use client";

import { useDraggable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { prefetchDrawerData } from "@/lib/queries/use-drawer-queries";
import type { BayViewWorkOrder } from "@/lib/services/bay-view-service";
import type { Vehicle } from "@/lib/types";
import { cn, formatPlateNumber } from "@/lib/utils";

/** Compute wait time text and urgency from a created_at timestamp. */
function _getWaitTime(createdAt: string): { text: string; urgent: boolean } {
  const minutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60000,
  );
  if (minutes < 15) return { text: `${minutes}m`, urgent: false };
  if (minutes < 60) return { text: `${minutes}m`, urgent: minutes > 30 };
  const hours = Math.floor(minutes / 60);
  return { text: `${hours}h+`, urgent: true };
}

interface CondensedQueueItemProps {
  workOrder: BayViewWorkOrder & { vehicle: Vehicle | null };
  onClick: () => void;
  /** orgId used to warm the drawer detail cache on hover/focus. */
  orgId?: string | null;
}

/**
 * A compact queue preview item used in the kanban "Available" column.
 * Shows plate number (large, bold) and wait time — no buttons, badges, or mechanic avatar.
 */
export function CondensedQueueItem({
  workOrder,
  onClick,
  orgId,
}: CondensedQueueItemProps) {
  const v = workOrder.vehicle;
  const [waitInfo, setWaitInfo] = useState(() =>
    _getWaitTime(workOrder.created_at),
  );

  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Warm the drawer detail cache when the user hovers or tabs to the item —
  // same 200ms debounce pattern as the list view rows.
  const handleHover = useCallback(() => {
    if (workOrder.id && orgId) {
      clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = setTimeout(() => {
        prefetchDrawerData(queryClient, orgId, workOrder.id);
      }, 200);
    }
  }, [orgId, queryClient, workOrder.id]);

  useEffect(() => {
    return () => clearTimeout(prefetchTimerRef.current);
  }, []);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `vehicle-${workOrder.id}`,
      data: { type: "vehicle", workOrderId: workOrder.id },
    });

  useEffect(() => {
    const ref = new Date(workOrder.created_at).getTime();
    const tick = () => {
      const minutes = Math.floor((Date.now() - ref) / 60000);
      if (minutes < 15) setWaitInfo({ text: `${minutes}m`, urgent: false });
      else if (minutes < 60)
        setWaitInfo({ text: `${minutes}m`, urgent: minutes > 30 });
      else
        setWaitInfo({
          text: `${Math.floor(minutes / 60)}h+`,
          urgent: true,
        });
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [workOrder.created_at]);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  if (!v) {
    return (
      <button
        type="button"
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={onClick}
        onMouseEnter={handleHover}
        onFocus={handleHover}
        style={style}
        className={cn(
          "flex flex-col gap-1 rounded-xl border border-border/60 bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition-colors w-full shrink-0",
          "cursor-grab touch-manipulation active:cursor-grabbing",
          isDragging && "opacity-50",
          "hover:bg-accent/30",
        )}
      >
        <span className="text-sm font-bold font-mono tracking-tight text-foreground">
          WO {workOrder.id.slice(0, 8)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Clock className="size-3" />
          {waitInfo.text} wait
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onMouseEnter={handleHover}
      onFocus={handleHover}
      style={style}
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-border/60 bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition-colors w-full shrink-0",
        "cursor-grab touch-manipulation active:cursor-grabbing",
        isDragging && "opacity-50",
        "hover:border-primary/30 hover:bg-accent/30",
      )}
    >
      <span className="text-sm font-bold font-mono tracking-tight text-foreground">
        {formatPlateNumber(v.plate_number)}
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Clock className="size-3" />
        {waitInfo.text} wait
        {waitInfo.urgent && (
          <span className="size-1.5 rounded-full bg-amber-500" />
        )}
      </span>
    </button>
  );
}
