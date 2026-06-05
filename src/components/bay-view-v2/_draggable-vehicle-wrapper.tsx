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
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "flex flex-1 items-center gap-4 cursor-grab active:cursor-grabbing select-none touch-manipulation hover:bg-muted/40 rounded-xl p-2 transition-all border border-transparent hover:border-border/40",
        isDragging &&
          "opacity-50 shadow-md bg-muted/20 border-dashed border-primary/30",
      )}
    >
      {children}
    </div>
  );
}
