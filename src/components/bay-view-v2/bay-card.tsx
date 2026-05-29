"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Car,
  Clock,
  Loader2,
  Plus,
  Play,
  Wrench,
  Check,
  CheckCircle,
  Trash2,
  ArrowRight,
  UserPlus,
} from "lucide-react";
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
import { MechanicBadge } from "./mechanic-badge";
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
  New: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  Diagnosing: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.2)]",
  "In Progress": "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]",
  "Ready for Pickup": "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  Completed: "bg-emerald-500/40",
  Cancelled: "bg-rose-400/40",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  New: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  Diagnosing:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
  "In Progress":
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
  "Ready for Pickup":
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Completed:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
  Cancelled:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
};

export function MongolianLicensePlate({
  plate,
}: {
  plate: string | null | undefined;
}) {
  if (!plate) return null;
  const formatted = formatPlateNumber(plate);

  // Check if plate matches Mongolian standard: e.g. 4 digits + 3 Cyrillic letters (e.g., 1234УАБ)
  const mongolianRegex = /^(\d{4})([А-Яа-яӨөҮү]{3})$/;
  const match = formatted.match(mongolianRegex);

  let digits = "";
  let letters = "";
  if (match) {
    digits = match[1];
    letters = match[2];
  } else {
    // Fallback: split digits and letters
    const digitMatch = formatted.match(/^(\d+)(.*)$/);
    if (digitMatch && digitMatch[1] && digitMatch[2]) {
      digits = digitMatch[1];
      letters = digitMatch[2];
    } else {
      digits = formatted;
    }
  }

  return (
    <div className="inline-flex items-center select-none shadow-sm rounded border border-slate-900 bg-white text-slate-900 px-2 py-0.5 font-mono text-[12px] font-bold h-6 min-w-[90px] justify-center gap-1.5 dark:border-slate-800 dark:shadow-md dark:shadow-black/25">
      {/* Soyombo Symbol Red Strip */}
      <div className="flex flex-col items-center justify-center border-r border-slate-200 pr-1.5 h-full select-none">
        <svg
          viewBox="0 0 10 16"
          className="w-2.5 h-4 fill-[#E02424]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="5" cy="2" r="1.2" />
          <polygon points="5,4.5 2.5,7 7.5,7" />
          <rect x="3.8" y="7.5" width="2.4" height="4" />
          <line
            x1="2.5"
            y1="7.5"
            x2="2.5"
            y2="11.5"
            stroke="#E02424"
            strokeWidth="0.8"
          />
          <line
            x1="7.5"
            y1="7.5"
            x2="7.5"
            y2="11.5"
            stroke="#E02424"
            strokeWidth="0.8"
          />
          <circle cx="5" cy="13" r="1" />
        </svg>
        <span className="text-[5px] font-sans font-black text-slate-500 scale-75 leading-none select-none">
          MNG
        </span>
      </div>
      {/* License Text */}
      <div className="flex items-center gap-1 leading-none text-slate-950 font-black">
        <span className="text-[13px] tracking-tight font-black">{digits}</span>
        {letters && (
          <span className="text-[11px] tracking-normal text-slate-800 font-extrabold">
            {letters}
          </span>
        )}
      </div>
    </div>
  );
}

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
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/65 px-1.5 py-0.5 rounded font-mono tabular-nums select-none border border-border/30">
      <Clock className="size-2.5 animate-pulse text-primary/70" />
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
        "flex flex-1 items-center gap-3 cursor-grab active:cursor-grabbing select-none touch-manipulation hover:bg-muted/40 rounded-lg p-1.5 transition-all border border-transparent hover:border-border/40",
        isDragging &&
          "opacity-50 shadow-md bg-muted/20 border-dashed border-primary/30",
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
      className={cn(
        "h-full transition-all duration-300",
        isOver && "scale-[1.02]",
      )}
    >
      <Card
        className={cn(
          "relative h-full min-h-[160px] flex flex-col transition-all duration-300 py-0 gap-0 overflow-hidden border-border/70",
          wo
            ? "bg-card hover:bg-card/90 cursor-pointer shadow-sm hover:shadow-md hover:border-primary/25 border"
            : "border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/15",
          isOver && !wo && "border-primary/50 bg-primary/5 shadow-inner",
          isPending && "opacity-55 pointer-events-none",
        )}
        onClick={() => wo && onOpenDetail(wo.id)}
      >
        {wo && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-[4px]",
              STATUS_ACCENT[wo.status] ?? "bg-primary",
            )}
          />
        )}

        {wo ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pl-4 pr-3 py-2 w-full select-none bg-muted/5">
              <span className="text-[11px] font-mono font-black text-foreground/80 tracking-wider">
                BAY {String(bay.bayNumber).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1.5">
                {isPending && (
                  <Loader2 className="size-3 animate-spin text-muted-foreground/60" />
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 px-2 text-[9px] font-bold uppercase tracking-wider rounded-full border",
                    STATUS_BADGE_CLASS[wo.status],
                  )}
                >
                  {wo.status === "In Progress" && (
                    <span className="mr-1.5 size-1.5 rounded-full bg-current animate-pulse inline-block" />
                  )}
                  {wo.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-2.5 px-4 py-3 flex-1 justify-between">
              <DraggableVehicleWrapper workOrderId={wo.id} disabled={isPending}>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shadow-sm">
                  <Car className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                  {v ? (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <MongolianLicensePlate plate={v.plate_number} />
                        <ElapsedTimer
                          startedAt={wo.started_at ?? wo.created_at}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground/95 truncate">
                          {v.make} {v.model}
                        </span>
                        {v.year && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Year: {v.year}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <Typography.Muted className="text-[10px] text-muted-foreground italic leading-none">
                      No vehicle data
                    </Typography.Muted>
                  )}
                </div>
              </DraggableVehicleWrapper>

              {/* Status Stepper Progression */}
              <div className="mt-1 flex items-center justify-between w-full relative px-1 select-none">
                <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-border/60 -translate-y-1/2 -z-10" />
                {["New", "Diagnosing", "In Progress", "Ready for Pickup"].map(
                  (step, idx) => {
                    const stepOrder = [
                      "New",
                      "Diagnosing",
                      "In Progress",
                      "Ready for Pickup",
                    ];
                    const currentIdx = stepOrder.indexOf(wo.status);
                    const isPast = stepOrder.indexOf(step) < currentIdx;
                    const isCurrent = step === wo.status;
                    const isFuture = stepOrder.indexOf(step) > currentIdx;

                    return (
                      <div
                        key={step}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className={cn(
                            "size-4 rounded-full border flex items-center justify-center text-[8px] font-black transition-all duration-300",
                            isPast &&
                              "bg-emerald-500 border-emerald-500 text-white shadow-sm",
                            isCurrent &&
                              "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-sm shadow-indigo-600/30 font-bold",
                            isFuture &&
                              "bg-background border-border text-muted-foreground/35",
                          )}
                        >
                          {isPast ? "✓" : idx + 1}
                        </div>
                        <span
                          className={cn(
                            "text-[8px] font-medium leading-none tracking-tight transition-colors",
                            isCurrent &&
                              "text-indigo-600 dark:text-indigo-400 font-bold",
                            !isCurrent && "text-muted-foreground/45",
                          )}
                        >
                          {step === "Ready for Pickup" ? "Ready" : step}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Assign Mechanic area */}
              <div className="mt-1 flex items-center gap-1.5 border-t border-border/30 pt-2.5">
                <MechanicBadge
                  workOrderId={wo.id}
                  mechanic={wo.mechanic}
                  disabled={isPending}
                  compact
                />
                {!wo.mechanic && (
                  <span className="text-[10px] text-muted-foreground/50 font-medium select-none">
                    Unassigned tech
                  </span>
                )}
              </div>
            </CardContent>

            <CardFooter className="mt-auto justify-between border-t border-border/40 bg-muted/20 px-3 py-1.5">
              <div className="flex items-center gap-1 w-full justify-between">
                {wo.status === "New" && (
                  <Button
                    size="xs"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] gap-1 rounded shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(wo.id, "Diagnosing");
                    }}
                    disabled={isPending}
                  >
                    <Play className="size-3" />
                    Start Diagnose
                  </Button>
                )}
                {wo.status === "Diagnosing" && (
                  <Button
                    size="xs"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] gap-1 rounded shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(wo.id, "In Progress");
                    }}
                    disabled={isPending}
                  >
                    <Wrench className="size-3" />
                    Start Repair
                  </Button>
                )}
                {wo.status === "In Progress" && (
                  <Button
                    size="xs"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] gap-1 rounded shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(wo.id, "Ready for Pickup");
                    }}
                    disabled={isPending}
                  >
                    <Check className="size-3" />
                    Mark Ready
                  </Button>
                )}
                {wo.status === "Ready for Pickup" && (
                  <Button
                    size="xs"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] gap-1 rounded shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(wo.id, "Completed");
                    }}
                    disabled={isPending}
                  >
                    <CheckCircle className="size-3" />
                    Complete Job
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
                      className="text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 ml-auto"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
              </div>
            </CardFooter>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onAssignClick?.(bay.bayNumber)}
            className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 h-auto min-h-[160px] text-center w-full group/btn cursor-pointer transition-colors relative"
          >
            {/* Grid Pattern Background for Empty State */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:10px_10px]" />

            <div className="flex size-9 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-background/80 shadow-sm group-hover/btn:scale-110 group-hover/btn:border-primary/50 group-hover/btn:text-primary transition-all duration-300 z-10">
              <Plus className="size-4 text-muted-foreground/60 group-hover/btn:text-primary transition-colors" />
            </div>

            <div className="flex flex-col gap-0.5 z-10">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-muted-foreground/80 group-hover/btn:text-primary transition-colors">
                BAY {String(bay.bayNumber).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-medium text-muted-foreground/50 tracking-tight">
                Available for service
              </span>
            </div>
          </button>
        )}
      </Card>
    </div>
  );
}
