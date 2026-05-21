"use client";

import { useDroppable } from "@dnd-kit/core";
import { Car, Clock, Maximize2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn, formatPlateNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const STATUS_ACCENT: Record<string, string> = {
  New: "bg-yellow-500",
  Diagnosing: "bg-blue-500",
  "In Progress": "bg-amber-500",
  "Ready for Pickup": "bg-emerald-500",
  Completed: "bg-emerald-500/40",
  Cancelled: "bg-red-400/40",
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  New: "secondary",
  Diagnosing: "outline",
  "In Progress": "default",
  "Ready for Pickup": "secondary",
  Completed: "outline",
  Cancelled: "destructive",
};

function ElapsedTimer({ startedAt }: { startedAt: string | null | undefined }) {
  const [display, setDisplay] = useState("");
  const startedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startedAt) { setDisplay(""); startedRef.current = null; return; }
    const ms = new Date(startedAt).getTime();
    startedRef.current = ms;
    const tick = () => {
      if (startedRef.current === null) return;
      setDisplay(formatDuration(Date.now() - startedRef.current));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!display) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
      <Clock className="size-2.5" />
      {display}
    </span>
  );
}

interface BayCardProps {
  bay: BaySlotData;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay?: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  onAssignClick?: (bayNumber: number) => void;
}

export function BayCard({
  bay,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  onAssignClick,
}: BayCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `bay-${bay.bayNumber}`,
  });
  const wo = bay.workOrder;
  const v = wo?.vehicle;

  return (
    <div
      ref={setNodeRef}
      className={cn("h-full", isOver && "ring-2 ring-primary/20 rounded-lg")}
    >
      <div
        className={cn(
          "relative flex flex-col rounded-lg border bg-card h-full transition-all overflow-hidden",
          wo
            ? "border-border/80"
            : "border-dashed border-muted-foreground/25 bg-muted/10",
          isOver && !wo && "border-primary/40 bg-primary/5",
        )}
      >
        {wo && (
          <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", STATUS_ACCENT[wo.status] ?? "bg-primary")} />
        )}

        {wo ? (
          <>
            <div className="flex items-center justify-between pl-2.5 pr-2 pt-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                Bay {String(bay.bayNumber).padStart(2, "0")}
              </span>
              <Badge
                variant={STATUS_BADGE_VARIANT[wo.status] ?? "outline"}
                className="text-[8px] h-4 px-1.5 font-medium"
              >
                {wo.status}
              </Badge>
            </div>

            <div className="flex-1 flex items-center gap-2 pl-2.5 pr-2 py-1.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/60 ring-1 ring-border/30">
                <Car className="size-3.5 text-muted-foreground/50" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                {v ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate leading-tight text-foreground/90">
                        {formatPlateNumber(v.plate_number)}
                      </span>
                      <ElapsedTimer startedAt={wo.started_at ?? wo.created_at} />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 truncate leading-tight">
                      {v.make} {v.model}
                      {v.year ? ` · ${v.year}` : ""}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {wo.mechanic ? (
                        <div className="flex items-center gap-1 min-w-0">
                          <Avatar className="size-3.5 shrink-0">
                            <AvatarFallback className="text-[5px] bg-primary/8 text-primary font-medium">
                              {wo.mechanic.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[9px] text-muted-foreground/70 truncate leading-tight font-medium">
                            {wo.mechanic.full_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/40 italic">Unassigned</span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No vehicle data</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/30 px-2 py-1 mt-auto">
              <div className="flex items-center gap-1">
                {wo.status === "New" && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(wo.id, "Diagnosing")}
                    className="inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Start Diagnose
                  </button>
                )}
                {wo.status === "Diagnosing" && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(wo.id, "In Progress")}
                    className="inline-flex items-center gap-1 rounded border border-amber-400/40 bg-amber-50/50 px-2 py-0.5 text-[9px] font-medium text-amber-700 hover:bg-amber-100/50 transition-colors dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  >
                    Start Work
                  </button>
                )}
                {wo.status === "In Progress" && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(wo.id, "Ready for Pickup")}
                    className="inline-flex items-center gap-1 rounded border border-emerald-400/40 bg-emerald-50/50 px-2 py-0.5 text-[9px] font-medium text-emerald-700 hover:bg-emerald-100/50 transition-colors dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                  >
                    Mark Ready
                  </button>
                )}
                {wo.status === "Ready for Pickup" && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(wo.id, "Completed")}
                    className="inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {wo.status !== "Completed" && wo.status !== "Cancelled" && onRemoveFromBay && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemoveFromBay(wo.id); }}
                    className="inline-flex items-center justify-center size-4 rounded text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Remove from bay"
                  >
                    <svg viewBox="0 0 15 15" fill="none" className="size-2.5" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4.5 3V1.5a1 1 0 011-1h4a1 1 0 011 1V3M1.5 3h12M3 3v9.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V3" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onOpenDetail(wo.id)}
                className="flex items-center justify-center size-5 rounded text-muted-foreground/30 hover:text-foreground hover:bg-muted transition-colors"
                title="Details"
              >
                <Maximize2 className="size-2.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onAssignClick?.(bay.bayNumber)}
            className="flex flex-1 flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-accent/10 transition-colors rounded-lg py-3"
          >
            <div className="flex size-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/30">
              <Plus className="size-3.5 text-muted-foreground/40" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground/50">
              Bay {String(bay.bayNumber).padStart(2, "0")}
            </span>
            <span className="text-[8px] text-muted-foreground/40">Available — click to assign</span>
          </button>
        )}
      </div>
    </div>
  );
}
