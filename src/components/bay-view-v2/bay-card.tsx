"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle,
  ChevronDown,
  Loader2,
  Play,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
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
import { MongolianLicensePlate } from "@/components/vehicles/license-plate";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
import { prefetchDrawerData } from "@/lib/queries/use-drawer-queries";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";
import {
  ALL_STATUSES,
  STATUS_ACCENT,
  STATUS_BADGE_CLASS,
  STATUS_TRANSLATION_KEYS,
} from "./_constants";
import { DraggableVehicleWrapper } from "./_draggable-vehicle-wrapper";
import { ElapsedTimer } from "./_elapsed-timer";
import { MechanicBadge } from "./mechanic-badge";

export { STATUS_BADGE_CLASS };

interface BayCardProps {
  bay: BaySlotData;
  isPending?: boolean;
  isKanbanMode?: boolean;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay?: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  onAssignClick?: (bayNumber: number) => void;
  onRemoveHelper?: (woId: string, mechanicId: string) => void;
  orgId?: string | null;
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

      <CardHeader className="flex w-full flex-row items-center justify-between border-b border-border/40 bg-muted/5 py-3 pl-4 pr-3 select-none">
        <span className="text-xs font-mono font-black tracking-wider text-foreground/80">
          BAY {String(bay.bayNumber).padStart(2, "0")}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "h-5 rounded-full border px-2 text-xs font-bold uppercase tracking-wider",
            STATUS_BADGE_CLASS[wo.status],
          )}
        >
          {wo.status === "In Progress" && (
            <span className="mr-2 inline-block size-1.5 rounded-full bg-current animate-pulse" />
          )}
          {wo.status}
        </Badge>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col gap-4 px-4 py-4 overflow-hidden">
        {/* Background brand watermark */}
        <VehicleMakeLogo
          make={v?.make}
          className="absolute -right-2 -bottom-3 size-20 text-primary/[0.06] pointer-events-none select-none"
          aria-hidden
        />
        <div className="relative flex min-w-0 flex-col gap-2 text-left">
            {v ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
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
  onRemoveHelper,
  orgId,
}: BayCardProps) {
  const t = useTranslations("bayView");
  const queryClient = useQueryClient();
  const { setNodeRef, isOver } = useDroppable({
    id: `bay-${bay.bayNumber}`,
  });
  const wo = bay.workOrder;

  // Prefetch work order detail on hover for instant drawer open
  const handleMouseEnter = useCallback(() => {
    if (wo?.id && orgId) {
      prefetchDrawerData(queryClient, orgId, wo.id);
    }
  }, [wo?.id, orgId, queryClient]);
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
          onMouseEnter={handleMouseEnter}
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
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pl-4 pr-3 py-3 w-full select-none bg-muted/5">
                <span className="text-xs font-mono font-black text-foreground/80 tracking-wider">
                  BAY {String(bay.bayNumber).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-2">
                  {isPending && (
                    <Loader2 className="size-3 animate-spin text-muted-foreground/60" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 px-2 text-xs font-bold uppercase tracking-wider rounded-full border cursor-pointer",
                          STATUS_BADGE_CLASS[wo.status],
                        )}
                      >
                        {wo.status === "In Progress" && (
                          <span className="mr-2 size-1.5 rounded-full bg-current animate-pulse inline-block" />
                        )}
                        {t(STATUS_TRANSLATION_KEYS[wo.status])}
                        <ChevronDown className="ml-1 size-3 text-muted-foreground/60" />
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
                          {t(STATUS_TRANSLATION_KEYS[status])}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="relative flex flex-col gap-4 px-4 py-4 flex-1 justify-between overflow-hidden">
                {/* Background brand watermark */}
                <VehicleMakeLogo
                  make={v?.make}
                  className="absolute -right-2 -bottom-3 size-20 text-primary/[0.06] pointer-events-none select-none"
                  aria-hidden
                />
                <DraggableVehicleWrapper
                  workOrderId={wo.id}
                  disabled={isPending || isKanbanMode}
                >
                  <div className="relative flex min-w-0 flex-col gap-2 text-left">
                    {v ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <MongolianLicensePlate plate={v.plate_number} />
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
                  <div className="absolute top-3 left-3 right-3 h-0.5 bg-border -z-10" />
                  {/* Active Progress Line */}
                  <div
                    className={cn(
                      "absolute top-3 left-3 h-0.5 -z-10 transition-all duration-500 ease-in-out rounded-full",
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
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className={cn(
                              "size-5 rounded-full border flex items-center justify-center text-xs font-black transition-all duration-300",
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
                              "text-xs font-bold leading-none tracking-tight transition-colors",
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
                <div className="mt-1 flex flex-col gap-2 border-t border-border/30 pt-2.5">
                  {/* Main mechanic */}
                  <div className="flex items-center gap-2">
                    <MechanicBadge
                      workOrderId={wo.id}
                      mechanic={wo.mechanic}
                      disabled={isPending}
                      role="main"
                    />
                    {!wo.mechanic && (
                      <span className="text-xs text-muted-foreground/50 font-bold select-none">
                        Unassigned tech
                      </span>
                    )}
                  </div>
                  {/* Helper mechanics */}
                  {(() => {
                    const helpers = (wo as Record<string, unknown>).helpers as
                      | Array<{
                          id: string;
                          full_name: string | null;
                          avatar_url: string | null;
                        }>
                      | undefined;
                    if (!helpers || helpers.length === 0) return null;
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        {helpers.map((helper) => (
                          <MechanicBadge
                            key={helper.id}
                            workOrderId={wo.id}
                            mechanic={helper}
                            disabled={isPending}
                            compact
                            onRemove={() => onRemoveHelper?.(wo.id, helper.id)}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>

              <CardFooter className="mt-auto justify-between border-t border-border/40 bg-muted/20 px-3 py-3">
                <div className="flex items-center gap-1 w-full justify-between">
                  {wo.status === "New" && (
                    <Button
                      size="xs"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1 rounded shadow-sm"
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1 rounded shadow-sm"
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 rounded shadow-sm"
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1 rounded shadow-sm"
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
                        <Trash2 className="size-4" />
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

              <div className="flex flex-col gap-1 z-10">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-muted-foreground/80 group-hover/btn:text-primary transition-colors">
                  BAY {String(bay.bayNumber).padStart(2, "0")}
                </span>
                <span className="text-xs font-medium text-muted-foreground/50 tracking-tight">
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
