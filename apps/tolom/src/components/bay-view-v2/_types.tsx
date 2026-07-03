"use client";

import { PointerSensor, TouchSensor } from "@dnd-kit/core";
import type { BaySlotData } from "@/lib/services/bay-view-service";

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

export interface ActiveDragState {
  type: string;
  label: string;
  previewBay?: BaySlotData | null;
}
