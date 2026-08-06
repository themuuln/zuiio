"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card } from "@/components/ui/card";
import { prefetchDrawerData } from "@/lib/queries/use-drawer-queries";
import { cn } from "@/lib/utils";
import { BayCardProvider } from "./_bay-card-context";
import { BayCardEmptyState } from "./_bay-card-empty-state";
import { BayCardOccupied } from "./_bay-card-occupied";
import type { BayCardProps } from "./_bay-card-types";
import { BayCardVehicleInfo } from "./_bay-card-vehicle-info";
import { BayNumberLabel } from "./_bay-number-label";
import { BayStatusBadge } from "./_bay-status-badge";
import { MechanicDisplay } from "./_mechanic-display";

export type { BayCardProps } from "./_bay-card-types";

export function BayCardDragPreview({ bay }: { bay: BayCardProps["bay"] }) {
  const wo = bay.workOrder;
  if (!wo) return null;
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[180px] flex-col gap-0 overflow-hidden rounded-xl border border-border/70 bg-card py-0",
      )}
    >
      <div className="flex select-none items-center justify-between py-2.5 pl-5 pr-3">
        <BayNumberLabel
          bayNumber={bay.bayNumber}
          className="text-foreground/80"
        />
        <BayStatusBadge status={wo.status} label={wo.status} />
      </div>
      <div className="h-px bg-border/40" />
      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3">
        <BayCardVehicleInfo
          vehicle={wo.vehicle}
          startedAt={wo.started_at ?? wo.created_at}
        />
        <MechanicDisplay
          variant="row"
          workOrderId={wo.id}
          mechanic={wo.mechanic}
          helpers={wo.helpers}
          status={wo.status}
          disabled
        />
      </div>
      <div className="h-px bg-border/40" />
      <div className="flex items-center gap-2 px-3 py-2.5" />
    </div>
  );
}

export const BayCard = React.memo(function BayCard({
  bay,
  isPending = false,
  isKanbanMode = false,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  onAssignClick,
  onRemoveHelper,
  orgId,
  mechanics = [],
  onAssignMechanic,
  onRemoveMechanic,
  onAddHelper,
  onReorderMechanics,
}: BayCardProps) {
  const queryClient = useQueryClient();
  const { setNodeRef, isOver } = useDroppable({
    id: `bay-${bay.bayNumber}`,
  });
  const wo = bay.workOrder;

  // ── Animate empty → occupied transition ──
  const prevWoRef = useRef(bay.workOrder);
  const [animateAssign, setAnimateAssign] = useState(false);
  useEffect(() => {
    if (!prevWoRef.current && bay.workOrder) {
      setAnimateAssign(true);
      const timer = setTimeout(() => setAnimateAssign(false), 600);
      return () => clearTimeout(timer);
    }
    prevWoRef.current = bay.workOrder;
  }, [bay.workOrder]);

  const handleMouseEnter = useCallback(() => {
    if (wo?.id && orgId) {
      prefetchDrawerData(queryClient, orgId, wo.id);
    }
  }, [wo?.id, orgId, queryClient]);

  const handlePointerDown = useCallback(() => {
    if (wo?.id && orgId) {
      prefetchDrawerData(queryClient, orgId, wo.id);
    }
  }, [wo?.id, orgId, queryClient]);

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
  const cardStyle = useMemo(() => {
    if (!transform) return undefined;
    return {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 50,
      willChange: isDragging ? "transform" : undefined,
    };
  }, [transform, isDragging]);

  const handleCardClick = useCallback(() => {
    if (wo) onOpenDetail(wo.id);
  }, [wo, onOpenDetail]);

  const providerValue = useMemo(
    () => ({
      woId: wo?.id ?? "",
      status: wo?.status ?? "",
      isPending,
      isKanbanMode,
      mechanics,
      onStatusChange,
      onRemoveFromBay,
      onOpenDetail,
      onRemoveHelper,
      onAssignMechanic,
      onRemoveMechanic,
      onAddHelper,
      onReorderMechanics,
    }),
    [
      wo?.id,
      wo?.status,
      isPending,
      isKanbanMode,
      mechanics,
      onStatusChange,
      onRemoveFromBay,
      onOpenDetail,
      onRemoveHelper,
      onAssignMechanic,
      onRemoveMechanic,
      onAddHelper,
      onReorderMechanics,
    ],
  );

  return (
    <section
      ref={setNodeRef}
      aria-label={`Bay ${bay.bayNumber}${wo ? ` - ${wo.vehicle?.plate_number ?? "occupied"}` : " - empty"}`}
      className={cn(
        "transition-[transform,opacity] duration-300",
        isOver && "scale-[1.02]",
        isOver && !wo && "animate-pulse-border",
      )}
    >
      <Card
        ref={setDraggableCardRef}
        {...(isCardDraggable ? listeners : {})}
        {...(isCardDraggable ? attributes : {})}
        style={cardStyle}
        className={cn(
          "flex h-full min-h-[220px] flex-col gap-0 overflow-hidden rounded-xl py-0 transition-[color,background-color,border-color,opacity,transform] duration-200",
          animateAssign && "animate-bay-assigned",
          wo
            ? "cursor-pointer bg-card ring-1 ring-foreground/10 hover:bg-accent/20 hover:ring-foreground/20"
            : "border border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/15",
          isOver && !wo && "border-primary/50 bg-primary/5",
          isOver && !!wo && "bg-primary/[0.02] ring-2 ring-primary/30",
          isCardDraggable &&
            "cursor-grab touch-manipulation active:cursor-grabbing",
          isDragging && "opacity-50",
          isPending && "pointer-events-none opacity-55",
        )}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onPointerDown={handlePointerDown}
      >
        {wo ? (
          <BayCardProvider value={providerValue}>
            <BayCardOccupied bay={bay} />
          </BayCardProvider>
        ) : (
          <BayCardEmptyState
            bayNumber={bay.bayNumber}
            onAssignClick={onAssignClick}
          />
        )}
      </Card>
    </section>
  );
});
