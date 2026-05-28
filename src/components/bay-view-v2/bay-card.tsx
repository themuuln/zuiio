"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Car, Clock, Loader2, Maximize2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn, formatPlateNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { MechanicBadge } from "../bay-view/mechanic-badge";
import { Typography } from "@/components/ui/typography";

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

const STATUS_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
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
    if (!startedAt) {
      setDisplay("");
      startedRef.current = null;
      return;
    }
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

function DraggableVehicleWrapper({
  workOrderId,
  children,
  disabled,
}: {
  workOrderId: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `vehicle-${workOrderId}`,
      data: { type: "vehicle", workOrderId },
      disabled,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "flex flex-1 items-center gap-2 cursor-grab active:cursor-grabbing select-none touch-manipulation",
        isDragging && "opacity-50 shadow-md bg-muted/20",
      )}
    >
      {children}
    </div>
  );
}

interface BayCardProps {
  bay: BaySlotData;
  isPending?: boolean;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay?: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  onAssignClick?: (bayNumber: number) => void;
}

export function BayCard({
  bay,
  isPending = false,
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
      className={cn("h-full", isOver && "ring-2 ring-primary/20")}
    >
      <Card
        className={cn(
          "relative h-full min-h-[145px] transition-all py-0 gap-0",
          wo
            ? "border-border/80 bg-card"
            : "border-dashed border-muted-foreground/25 bg-muted/10",
          isOver && !wo && "border-primary/40 bg-primary/5",
          isPending && "opacity-55 pointer-events-none",
        )}
      >
        {wo && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-[3px]",
              STATUS_ACCENT[wo.status] ?? "bg-primary",
            )}
          />
        )}

        {wo ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pl-3 pr-2.5 py-1.5 w-full">
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                Bay {String(bay.bayNumber).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1">
                {isPending && (
                  <Loader2 className="size-2.5 animate-spin text-muted-foreground/60 mr-0.5" />
                )}
                <Badge
                  variant={STATUS_BADGE_VARIANT[wo.status] ?? "outline"}
                  className="h-4.5 px-1 text-[8.5px] font-medium leading-none"
                >
                  {wo.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-1 px-3 py-1.5">
              <DraggableVehicleWrapper workOrderId={wo.id} disabled={isPending}>
                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/60 ring-1 ring-border/30">
                  <Car className="size-2.5 text-muted-foreground/50" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-px text-left">
                  {v ? (
                    <>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold truncate leading-tight text-foreground/90">
                          {formatPlateNumber(v.plate_number)}
                        </span>
                        <ElapsedTimer
                          startedAt={wo.started_at ?? wo.created_at}
                        />
                      </div>
                      <Typography.Muted className="text-[9px] text-muted-foreground/60 truncate leading-none">
                        {v.make} {v.model}
                        {v.year ? ` · ${v.year}` : ""}
                      </Typography.Muted>
                    </>
                  ) : (
                    <Typography.Muted className="text-[9px] text-muted-foreground italic leading-none">
                      No vehicle data
                    </Typography.Muted>
                  )}
                </div>
              </DraggableVehicleWrapper>

              <div className="mt-0 flex min-h-[20px] items-center gap-1 border-t border-border/10 pt-1.5">
                <MechanicBadge
                  workOrderId={wo.id}
                  mechanic={wo.mechanic}
                  disabled={isPending}
                  compact
                />
              </div>
            </CardContent>

            <CardFooter className="mt-auto justify-between border-t border-border/30 bg-muted/20 px-3 py-1">
              <div className="flex items-center gap-0.5">
                {wo.status === "New" && (
                  <Button
                    size="xs"
                    onClick={() => onStatusChange(wo.id, "Diagnosing")}
                    disabled={isPending}
                  >
                    Start Diagnose
                  </Button>
                )}
                {wo.status === "Diagnosing" && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onStatusChange(wo.id, "In Progress")}
                    disabled={isPending}
                  >
                    Start Work
                  </Button>
                )}
                {wo.status === "In Progress" && (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => onStatusChange(wo.id, "Ready for Pickup")}
                    disabled={isPending}
                  >
                    Mark Ready
                  </Button>
                )}
                {wo.status === "Ready for Pickup" && (
                  <Button
                    size="xs"
                    onClick={() => onStatusChange(wo.id, "Completed")}
                    disabled={isPending}
                  >
                    Complete
                  </Button>
                )}
                {wo.status !== "Completed" &&
                  wo.status !== "Cancelled" &&
                  onRemoveFromBay && (
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromBay(wo.id);
                      }}
                      title="Remove from bay"
                      disabled={isPending}
                    >
                      <svg
                        viewBox="0 0 15 15"
                        fill="none"
                        className="size-2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M4.5 3V1.5a1 1 0 011-1h4a1 1 0 011 1V3M1.5 3h12M3 3v9.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V3" />
                      </svg>
                    </Button>
                  )}
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => onOpenDetail(wo.id)}
                title="Details"
                disabled={isPending}
              >
                <Maximize2 className="size-2.5" />
              </Button>
            </CardFooter>
          </>
        ) : (
          <Button
            variant="ghost"
            onClick={() => onAssignClick?.(bay.bayNumber)}
            className="flex flex-1 flex-col items-center justify-center gap-1 px-3 py-3 h-auto min-h-[130px] text-center"
          >
            <div className="flex size-7 items-center justify-center border border-dashed border-muted-foreground/30 bg-background/80">
              <Plus className="size-3 text-muted-foreground/40" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
              Bay {String(bay.bayNumber).padStart(2, "0")}
            </span>
          </Button>
        )}
      </Card>
    </div>
  );
}
