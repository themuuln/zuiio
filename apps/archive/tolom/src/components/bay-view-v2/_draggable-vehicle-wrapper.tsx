"use client";

import { useDraggable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DraggableVehicleWrapper({
  workOrderId,
  children,
  disabled,
}: {
  workOrderId: string;
  children: ReactNode;
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
    // biome-ignore lint/a11y/useSemanticElements: draggable wrapper must be div for dnd-kit transform/positioning
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="group"
      aria-roledescription="draggable vehicle"
      style={style}
      className={cn(
        "group flex min-w-0 cursor-grab select-none rounded-lg px-1 py-1 touch-manipulation transition-[background-color,opacity,transform] duration-200 hover:bg-muted/30 active:cursor-grabbing",
        isDragging && "bg-muted/40 opacity-50 ring-1 ring-primary/30",
      )}
    >
      {children}
    </div>
  );
}
