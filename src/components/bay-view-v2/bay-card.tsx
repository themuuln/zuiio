"use client";

import React, { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { prefetchDrawerData } from "@/lib/queries/use-drawer-queries";
import { cn } from "@/lib/utils";
import { BayCardAccent } from "./_bay-card-accent";
import { BayCardEmptyState } from "./_bay-card-empty-state";
import { BayCardOccupied } from "./_bay-card-occupied";
import { BayCardPreview } from "./_bay-card-preview";
import type { BayCardProps } from "./_bay-card-types";

export type { BayCardProps } from "./_bay-card-types";

export function BayCardDragPreview({
  bay,
}: {
  bay: BayCardProps["bay"];
}) {
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
}: BayCardProps) {
  const queryClient = useQueryClient();
  const { setNodeRef, isOver } = useDroppable({
    id: `bay-${bay.bayNumber}`,
  });
  const wo = bay.workOrder;

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
  const cardStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`Bay ${bay.bayNumber}${wo ? ` - ${wo.vehicle?.plate_number ?? "occupied"}` : " - empty"}`}
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
            "relative flex h-full flex-col gap-0 rounded-xl border-border/70 py-0 transition-all duration-300",
            wo
              ? "cursor-pointer border bg-card shadow-sm hover:border-primary/25 hover:bg-card/90 hover:shadow-md"
              : "border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/15",
            isOver && !wo && "border-primary/50 bg-primary/5 shadow-inner",
            isCardDraggable &&
              "cursor-grab touch-manipulation active:cursor-grabbing",
            isDragging && "opacity-50 shadow-xl",
            isPending && "pointer-events-none opacity-55",
          )}
          onClick={() => wo && onOpenDetail(wo.id)}
          onMouseEnter={handleMouseEnter}
        >
          {wo && <BayCardAccent status={wo.status} />}

          {wo ? (
            <BayCardOccupied
              bay={bay}
              isPending={isPending}
              isKanbanMode={isKanbanMode}
              mechanics={mechanics}
              onStatusChange={onStatusChange}
              onRemoveFromBay={onRemoveFromBay}
              onOpenDetail={onOpenDetail}
              onRemoveHelper={onRemoveHelper}
              onPauseTimer={onPauseTimer}
              onAddNote={onAddNote}
              onQuickAddService={onQuickAddService}
              onQuickAddParts={onQuickAddParts}
              onAssignMechanic={onAssignMechanic}
              onRemoveMechanic={onRemoveMechanic}
            />
          ) : (
            <BayCardEmptyState
              bayNumber={bay.bayNumber}
              onAssignClick={onAssignClick}
            />
          )}
        </Card>
      </div>
    </div>
  );
});
