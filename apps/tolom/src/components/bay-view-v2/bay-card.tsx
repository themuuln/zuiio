"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { prefetchDrawerData } from "@/lib/queries/use-drawer-queries";
import { cn } from "@/lib/utils";
import { STATUS_ACCENT, URGENCY_CRITICAL, URGENCY_WARNING } from "./_constants";
import { BayCardEmptyState } from "./_bay-card-empty-state";
import { BayCardOccupied } from "./_bay-card-occupied";
import { BayCardPreview } from "./_bay-card-preview";
import { BayCardProvider } from "./_bay-card-context";
import { elapsedMinutes } from "./_helpers";

import type { BayCardProps } from "./_bay-card-types";

export type { BayCardProps } from "./_bay-card-types";

export function BayCardDragPreview({ bay }: { bay: BayCardProps["bay"] }) {
  return <BayCardPreview bay={bay} />;
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
  onPauseTimer,
  onAddNote,
  onQuickAddService,
  onQuickAddParts,
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
  const elapsed = elapsedMinutes(wo?.started_at);
  const urgencyClass =
    elapsed != null && elapsed > 180
      ? `${URGENCY_CRITICAL} animate-pulse`
      : elapsed != null && elapsed > 120
        ? `${URGENCY_WARNING} animate-pulse`
        : "";

  const handleMouseEnter = useCallback(() => {
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
      willChange: "transform",
    };
  }, [transform]);

  return (
    <section
      ref={setNodeRef}
      aria-label={`Bay ${bay.bayNumber}${wo ? ` - ${wo.vehicle?.plate_number ?? "occupied"}` : " - empty"}`}
      className={cn(
        "transition-all duration-300",
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
          "flex h-full flex-col gap-0 rounded-xl py-0 transition-[color,background-color,border-color,opacity,box-shadow] duration-300",
          wo
            ? "cursor-pointer border bg-card shadow-none ring-1 ring-foreground/10 hover:border-primary/25 hover:bg-card/90 hover:ring-2 hover:ring-foreground/15"
            : "border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/15",
          isOver && !wo && "border-primary/50 bg-primary/5",
          isOver && !!wo && "ring-2 ring-primary/30 bg-primary/[0.02]",
          isCardDraggable &&
            "cursor-grab touch-manipulation active:cursor-grabbing",
          isDragging && "opacity-50",
          isPending && "pointer-events-none opacity-55",
        )}
        onClick={() => wo && onOpenDetail(wo.id)}
        onMouseEnter={handleMouseEnter}
      >
        {wo && (
          <div
            className={cn(
              "h-1 w-full shrink-0 rounded-t-xl",
              STATUS_ACCENT[wo.status] ?? "bg-muted",
              urgencyClass,
            )}
          />
        )}

        {wo ? (
          <BayCardProvider
            value={{
              woId: wo.id,
              status: wo.status,
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
              onPauseTimer,
              onAddNote,
              onQuickAddService,
              onQuickAddParts,
            }}
          >
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
