"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle,
  FileText,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  Timer,
  Trash2,
  UserPlus,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  onPauseTimer?: (woId: string) => void;
  onAddNote?: (woId: string) => void;
  onQuickAddService?: (woId: string) => void;
  onQuickAddParts?: (woId: string) => void;
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
          size="85%"
          className="absolute inset-0 m-auto pointer-events-none select-none text-primary/[0.02]"
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

        <div className="flex items-center gap-2 border-t border-border/30 pt-2.5">
          <MechanicBadge
            workOrderId={wo.id}
            mechanic={wo.mechanic}
            disabled
            status={wo.status}
          />
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
  onPauseTimer,
  onAddNote,
  onQuickAddService,
  onQuickAddParts,
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
      className={cn("transition-all duration-300", isOver && "scale-[1.02]")}
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
            "relative h-full flex flex-col transition-all duration-300 py-0 gap-0 rounded-xl border-border/70",
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
              {/* Header: Bay number + status badge */}
              <div className="flex items-center justify-between pl-5 pr-3 py-2.5 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black tracking-wider text-foreground/80">
                    BAY {String(bay.bayNumber).padStart(2, "0")}
                  </span>
                  {isPending && (
                    <Loader2 className="size-3 animate-spin text-muted-foreground/60" />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 px-2 text-xs font-bold uppercase tracking-wider rounded-full border",
                    STATUS_BADGE_CLASS[wo.status],
                  )}
                >
                  {wo.status === "In Progress" && (
                    <span className="mr-2 size-1.5 rounded-full bg-current animate-pulse inline-block" />
                  )}
                  {t(STATUS_TRANSLATION_KEYS[wo.status])}
                </Badge>
              </div>

              <Separator />

              {/* Content: Vehicle info + mechanic */}
              <div className="flex flex-col gap-2.5 px-4 py-3 flex-1">
                <DraggableVehicleWrapper
                  workOrderId={wo.id}
                  disabled={isPending || isKanbanMode}
                >
                  <div className="flex min-w-0 flex-col gap-1 text-left">
                    {v ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <MongolianLicensePlate plate={v.plate_number} />
                          <ElapsedTimer
                            startedAt={wo.started_at ?? wo.created_at}
                          />
                        </div>
                        <span className="text-sm font-bold text-foreground/95 truncate">
                          {v.make} {v.model}
                          {v.year ? ` · ${v.year}` : ""}
                        </span>
                      </>
                    ) : (
                      <Typography.Muted className="text-xs text-muted-foreground italic leading-none">
                        No vehicle data
                      </Typography.Muted>
                    )}
                  </div>
                </DraggableVehicleWrapper>

                <div className="flex flex-wrap items-center gap-2">
                  <MechanicBadge
                    workOrderId={wo.id}
                    mechanic={wo.mechanic}
                    disabled={isPending}
                    role="main"
                    status={wo.status}
                  />
                  {!wo.mechanic && (
                    <span className="text-xs text-muted-foreground/50 font-bold select-none">
                      Unassigned tech
                    </span>
                  )}
                  {(() => {
                    const helpers = (wo as Record<string, unknown>).helpers as
                      | Array<{
                          id: string;
                          full_name: string | null;
                          avatar_url: string | null;
                        }>
                      | undefined;
                    if (!helpers || helpers.length === 0) return null;
                    return helpers.map((helper) => (
                      <MechanicBadge
                        key={helper.id}
                        workOrderId={wo.id}
                        mechanic={helper}
                        disabled={isPending}
                        compact
                        onRemove={() => onRemoveHelper?.(wo.id, helper.id)}
                      />
                    ));
                  })()}
                </div>
              </div>

              <Separator />

              {/* Footer: Status action + menu + remove */}
              <div className="flex items-center gap-2 px-3 py-2">
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
                    <Play className="size-3" /> Start
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
                    <Wrench className="size-3" /> Repair
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
                    <Check className="size-3" /> Ready
                  </Button>
                )}
                {wo.status === "Ready for Pickup" && (
                  <Button
                    size="xs"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 rounded shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(wo.id, "Completed");
                    }}
                    disabled={isPending}
                  >
                    <CheckCircle className="size-3" /> Complete
                  </Button>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={isPending}
                        className="text-muted-foreground/60 hover:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={4}
                      className="w-48"
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onPauseTimer?.(wo.id);
                        }}
                        className="gap-2 text-xs"
                      >
                        <Timer className="size-3.5" /> Pause Timer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddNote?.(wo.id);
                        }}
                        className="gap-2 text-xs"
                      >
                        <FileText className="size-3.5" /> Add Note
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAddService?.(wo.id);
                        }}
                        className="gap-2 text-xs"
                      >
                        <Wrench className="size-3.5" /> Add Service
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAddParts?.(wo.id);
                        }}
                        className="gap-2 text-xs"
                      >
                        <Plus className="size-3.5" /> Add Parts
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(wo.id);
                        }}
                        className="gap-2 text-xs"
                      >
                        <UserPlus className="size-3.5" /> Assign Mechanic
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                        className="text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                </div>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onAssignClick?.(bay.bayNumber)}
              className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center w-full group/btn cursor-pointer transition-colors relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:12px_12px] transition-opacity duration-300 group-hover/btn:opacity-60" />

              <div className="flex size-10 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted/40 shadow-sm group-hover/btn:scale-110 group-hover/btn:border-primary/50 group-hover/btn:bg-primary/10 group-hover/btn:text-primary transition-all duration-300 z-10">
                <Plus className="size-5 text-muted-foreground/50 group-hover/btn:text-primary transition-colors" />
              </div>

              <div className="flex flex-col gap-0.5 z-10">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-muted-foreground/70 group-hover/btn:text-primary/80 transition-colors">
                  BAY {String(bay.bayNumber).padStart(2, "0")}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground/40 tracking-tight">
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
