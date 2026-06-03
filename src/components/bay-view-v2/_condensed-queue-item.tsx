"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { formatPlateNumber } from "@/lib/utils";

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
  workOrder: WorkOrder & { vehicle: Vehicle | null };
  onClick: () => void;
}

/**
 * A compact queue preview item used in the kanban "Available" column.
 * Shows plate number (large, bold) and wait time — no buttons, badges, or mechanic avatar.
 */
export function CondensedQueueItem({
  workOrder,
  onClick,
}: CondensedQueueItemProps) {
  const v = workOrder.vehicle;
  const [waitInfo, setWaitInfo] = useState(() =>
    _getWaitTime(workOrder.created_at),
  );

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

  if (!v) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-left shadow-sm hover:bg-accent/30 transition-colors cursor-pointer w-full shrink-0"
      >
        <span className="text-sm font-bold font-mono tracking-tight text-foreground">
          WO {workOrder.id.slice(0, 8)}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Clock className="size-2.5" />
          {waitInfo.text} wait
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-left shadow-sm hover:border-primary/30 hover:bg-accent/30 transition-colors cursor-pointer w-full shrink-0"
    >
      <span className="text-sm font-bold font-mono tracking-tight text-foreground">
        {formatPlateNumber(v.plate_number)}
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
        <Clock className="size-2.5" />
        {waitInfo.text} wait
        {waitInfo.urgent && (
          <span className="size-1.5 rounded-full bg-amber-500" />
        )}
      </span>
    </button>
  );
}
