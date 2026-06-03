"use client";

import { PointerSensor, TouchSensor, useDroppable } from "@dnd-kit/core";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "kanban" | "list";

function shouldIgnoreDragActivation(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    '[data-no-dnd="true"], button, a, input, textarea, select',
  );
}

export class GuardedPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: React.PointerEvent) =>
        !shouldIgnoreDragActivation(nativeEvent.target),
    },
  ];
}

export class GuardedTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: ({ nativeEvent }: React.TouchEvent) =>
        !shouldIgnoreDragActivation(nativeEvent.target),
    },
  ];
}

export interface ToastState {
  message: string;
  variant: "info" | "error";
}

export interface ActiveDragState {
  type: string;
  label: string;
  previewBay?: BaySlotData | null;
}

export function KanbanDropColumn({
  status,
  children,
  className,
}: {
  status: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `kanban-status-${encodeURIComponent(status)}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-200 rounded-xl",
        isOver && "bg-primary/5 ring-1 ring-primary/20",
        className,
      )}
    >
      {children}
    </div>
  );
}
