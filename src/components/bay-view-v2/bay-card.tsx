"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Car,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Loader2,
  Play,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Typography } from "@/components/ui/typography";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn, formatPlateNumber } from "@/lib/utils";
import { MechanicBadge } from "./mechanic-badge";

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

const ALL_STATUSES = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

/**
 * Simple text-only plate display without the SVG Soyombo symbol.
 * Used on BayCards for performance; full SVG is in the detail drawer.
 */
export function TextPlate({ plate }: { plate: string | null | undefined }) {
  if (!plate) return null;
  const formatted = formatPlateNumber(plate);
  return (
    <div className="inline-flex items-center select-none rounded border border-border bg-background px-2 py-0.5 font-mono text-xs font-bold h-6 justify-center shadow-sm">
      {formatted}
    </div>
  );
}

export function MongolianLicensePlate({
  plate,
}: {
  plate: string | null | undefined;
}) {
  const soyomboMaskId = useId();
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
    if (digitMatch?.[1] && digitMatch[2]) {
      digits = digitMatch[1];
      letters = digitMatch[2];
    } else {
      digits = formatted;
    }
  }

  return (
    <div className="inline-flex items-center select-none shadow-sm rounded border border-slate-900 bg-white text-slate-900 px-2 py-0.5 font-mono text-[13px] font-bold h-7 min-w-[95px] justify-center gap-1.5 dark:border-slate-800 dark:shadow-md dark:shadow-black/25">
      {/* Soyombo Symbol Red Strip */}
      <div className="flex flex-col items-center justify-center border-r border-slate-200 pr-1.5 h-full select-none">
        <svg
          viewBox="0 0 440 900"
          className="w-3 h-5 fill-[#E02424]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Soyombo Symbol</title>
          <defs>
            <mask id={soyomboMaskId}>
              <path d="M0 0h400v600h-400z" fill="#fff" />
              <g fill="#000">
                <circle cx="200" cy="180" r="60" />
                <circle cx="200" cy="363.5" r="10" />
                <circle cx="200" cy="416.5" r="10" />
                <path d="M200 334a29.5 29.5 0 0 1 0 59 23.5 23.5 0 0 0 0 47v6a29.5 29.5 0 0 1 0-59 23.5 23.5 0 0 0 0-47z" />
              </g>
            </mask>
          </defs>
          <g transform="scale(2) translate(-90 -60)">
            <circle cx="200" cy="205" r="55" mask={`url(#${soyomboMaskId})`} />
            <circle cx="200" cy="190" r="40" />
            <path d="M204.2035 60c-4.97 2.255-6.827 6.321-7.227 10.371-.25 3.41 1.255 7.251 1.405 10.586 0 5.739-5.938 7.629-5.938 15.82 0 2.815 2.6 5.917 2.6 13.223-.45 3.835-2.59 4.7-5 5a5 5 0 0 1-5-5 5 5 0 0 1 1.385-3.44 5 5 0 0 1 .51-.5c1.14-1.15 2.705-1.595 2.695-4.63 0-1.56-1.01-2.98-1.975-5.742-.91-2.68-.25-7.16 1.915-9.805-3.5 1.35-5.657 4.705-6.757 7.715-1.16 3.7-.15 5.831-1.74 8.906-.97 1.99-2.125 2.815-3.22 4.475-1.295 1.81-2.815 6.043-2.815 8.008a25 25 0 0 0 50 0c0-1.965-1.5-6.198-2.795-8.008-1.095-1.66-2.27-2.485-3.24-4.475-1.57-3.075-.56-5.206-1.72-8.906-1.1-3.01-3.26-6.364-6.758-7.715 2.165 2.645 2.825 7.125 1.915 9.805-.97 2.76-1.99 4.18-1.99 5.742 0 3.035 1.555 3.48 2.695 4.63a5 5 0 0 1 .51.5 5 5 0 0 1 1.385 3.44 5 5 0 0 1-5 5c-2.765-.35-4.75-1.64-5-5 0-9.626 4.12-10.24 4.12-17.363 0-10.171-9.121-14.986-9.121-22.422 0-2.52.59-6.815 4.16-10.2275zM90 270h50v240H90zm170 0h50v240h-50zm-110 0h100l-50 30zm0 40h100v20H150zm0 140h100v20H150zm0 30h100l-50 30z" />
            <circle cx="200" cy="390" r="50" mask={`url(#${soyomboMaskId})`} />
          </g>
        </svg>
        <span className="text-[5px] font-sans font-black text-slate-500 scale-75 leading-none select-none">
          MNG
        </span>
      </div>
      {/* License Text */}
      <div className="flex items-center gap-1 leading-none text-slate-950 font-black">
        <span className="text-[14px] tracking-tight font-black">{digits}</span>
        {letters && (
          <span className="text-[12px] tracking-normal text-slate-800 font-extrabold">
            {letters}
          </span>
        )}
      </div>
    </div>
  );
}

function ElapsedTimer({ startedAt }: { startedAt: string | null | undefined }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  const ms = new Date(startedAt).getTime();
  const elapsed = Math.max(0, now - ms);
  const display = formatDuration(elapsed);

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded font-mono tabular-nums select-none border border-border/30">
      <Clock className="size-3 animate-pulse text-primary/70" />
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
        "flex flex-1 items-center gap-3.5 cursor-grab active:cursor-grabbing select-none touch-manipulation hover:bg-muted/40 rounded-xl p-2 transition-all border border-transparent hover:border-border/40",
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
  isKanbanMode?: boolean;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay?: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  onAssignClick?: (bayNumber: number) => void;
}

export function BayCardDragPreview({ bay }: { bay: BaySlotData }) {
  const wo = bay.workOrder;
  const v = wo?.vehicle;

  if (!wo) return null;

  return (
    <Card className="relative flex min-h-[160px] w-[320px] flex-col gap-0 overflow-hidden border border-border/70 bg-card py-0 shadow-2xl">
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[4px]",
          STATUS_ACCENT[wo.status] ?? "bg-primary",
        )}
      />

      <CardHeader className="flex w-full flex-row items-center justify-between border-b border-border/40 bg-muted/5 py-2.5 pl-4 pr-3 select-none">
        <span className="text-[11px] font-mono font-black tracking-wider text-foreground/80">
          BAY {String(bay.bayNumber).padStart(2, "0")}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "h-5 rounded-full border px-2 text-[9px] font-bold uppercase tracking-wider",
            STATUS_BADGE_CLASS[wo.status],
          )}
        >
          {wo.status === "In Progress" && (
            <span className="mr-1.5 inline-block size-1.5 rounded-full bg-current animate-pulse" />
          )}
          {wo.status}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3.5 px-4 py-3.5">
        <div className="flex items-center gap-3.5 rounded-xl border border-transparent p-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <Car className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left">
            {v ? (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
                  <MongolianLicensePlate plate={v.plate_number} />
                  <ElapsedTimer startedAt={wo.started_at ?? wo.created_at} />
                </div>
                <div className="flex flex-col">
                  <span className="truncate text-sm font-bold text-foreground/95">
                    {v.make} {v.model}
                  </span>
                  {v.year && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      Year: {v.year}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <Typography.Muted className="text-xs italic leading-none text-muted-foreground">
                No vehicle data
              </Typography.Muted>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border/30 pt-2.5">
          <MechanicBadge workOrderId={wo.id} mechanic={wo.mechanic} disabled />
          {!wo.mechanic && (
            <span className="text-xs font-bold text-muted-foreground/50 select-none">
              Unassigned tech
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BayCard({
  bay,
  isPending = false,
  isKanbanMode = false,
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
  const isCardDraggable = isKanbanMode && !!wo && !isPending;
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableCardRef,
    transform,
    isDragging,
  } = useDraggable({
    id: wo ? `kanban-vehicle-${wo.id}` : `bay-card-${bay.bayNumber}`,
    data: wo ? { type: "vehicle", workOrderId: wo.id } : undefined,
    disabled: !isCardDraggable,
  });
  const cardStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full transition-all duration-300",
        isOver && "scale-[1.02]",
      )}
    >
      <div
        ref={setDraggableCardRef}
        {...(isCardDraggable ? listeners : {})}
        {...(isCardDraggable ? attributes : {})}
        style={cardStyle}
        className="h-full"
      >
        <Card
          className={cn(
            "relative h-full min-h-[160px] flex flex-col transition-all duration-300 py-0 gap-0 overflow-hidden border-border/70",
            wo
              ? "bg-card hover:bg-card/90 cursor-pointer shadow-sm hover:shadow-md hover:border-primary/25 border"
              : "border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/15",
            isOver && !wo && "border-primary/50 bg-primary/5 shadow-inner",
            isCardDraggable &&
              "cursor-grab active:cursor-grabbing touch-manipulation",
            isDragging && "opacity-50 shadow-xl",
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
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pl-4 pr-3 py-2.5 w-full select-none bg-muted/5">
                <span className="text-[11px] font-mono font-black text-foreground/80 tracking-wider">
                  BAY {String(bay.bayNumber).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-1.5">
                  {isPending && (
                    <Loader2 className="size-3 animate-spin text-muted-foreground/60" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 px-2 text-[9px] font-bold uppercase tracking-wider rounded-full border cursor-pointer",
                          STATUS_BADGE_CLASS[wo.status],
                        )}
                      >
                        {wo.status === "In Progress" && (
                          <span className="mr-1.5 size-1.5 rounded-full bg-current animate-pulse inline-block" />
                        )}
                        {wo.status}
                        <ChevronDown className="ml-1 size-2.5 text-muted-foreground/60" />
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4}>
                      {ALL_STATUSES.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(wo.id, status);
                          }}
                          className="gap-2 text-xs"
                        >
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              STATUS_BADGE_CLASS[status]
                                ?.match(/text-\w+-\d+/)?.[0]
                                ?.replace("text", "bg") ??
                                "bg-muted-foreground",
                            )}
                          />
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3.5 px-4 py-3.5 flex-1 justify-between">
                <DraggableVehicleWrapper
                  workOrderId={wo.id}
                  disabled={isPending || isKanbanMode}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
                    <Car className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5 text-left">
                    {v ? (
                      <>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <TextPlate plate={v.plate_number} />
                          <ElapsedTimer
                            startedAt={wo.started_at ?? wo.created_at}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground/95 truncate">
                            {v.make} {v.model}
                          </span>
                          {v.year && (
                            <span className="text-xs text-muted-foreground font-semibold">
                              Year: {v.year}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <Typography.Muted className="text-xs text-muted-foreground italic leading-none">
                        No vehicle data
                      </Typography.Muted>
                    )}
                  </div>
                </DraggableVehicleWrapper>

                {/* Status Stepper Progression */}
                <div className="mt-1 flex items-center justify-between w-full relative px-1 select-none isolate">
                  {/* Background Line */}
                  <div className="absolute top-[10px] left-2.5 right-2.5 h-0.5 bg-border -z-10" />
                  {/* Active Progress Line */}
                  <div
                    className={cn(
                      "absolute top-[10px] left-2.5 h-0.5 -z-10 transition-all duration-500 ease-in-out rounded-full",
                      wo.status === "Diagnosing" && "bg-blue-500",
                      wo.status === "In Progress" && "bg-indigo-500",
                      (wo.status === "Ready for Pickup" ||
                        wo.status === "Completed") &&
                        "bg-emerald-500",
                    )}
                    style={{
                      width: (() => {
                        const stepOrder = [
                          "New",
                          "Diagnosing",
                          "In Progress",
                          "Ready for Pickup",
                        ];
                        let currentIdx = stepOrder.indexOf(wo.status);
                        if (wo.status === "Completed") currentIdx = 3;
                        if (currentIdx <= 0) return "0%";
                        const pct = (currentIdx / (stepOrder.length - 1)) * 100;
                        const offset =
                          (currentIdx / (stepOrder.length - 1)) * 20;
                        return `calc(${pct}% - ${offset}px)`;
                      })(),
                    }}
                  />
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
                          className="flex flex-col items-center gap-1.5"
                        >
                          <div
                            className={cn(
                              "size-5 rounded-full border flex items-center justify-center text-[9px] font-black transition-all duration-300",
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
                              "text-[9px] font-bold leading-none tracking-tight transition-colors",
                              isCurrent &&
                                "text-indigo-600 dark:text-indigo-400 font-extrabold",
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
                <div className="mt-1 flex items-center gap-2 border-t border-border/30 pt-2.5">
                  <MechanicBadge
                    workOrderId={wo.id}
                    mechanic={wo.mechanic}
                    disabled={isPending}
                  />
                  {!wo.mechanic && (
                    <span className="text-xs text-muted-foreground/50 font-bold select-none">
                      Unassigned tech
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="mt-auto justify-between border-t border-border/40 bg-muted/20 px-3 py-2.5">
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
    </div>
  );
}
