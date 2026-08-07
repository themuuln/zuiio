"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggablePlayerCardProps {
  playerId: string;
  children: React.ReactNode;
  className?: string;
}

export function DraggablePlayerCard({
  playerId,
  children,
  className,
}: DraggablePlayerCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `player-${playerId}` });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group", className)}
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        className={cn(
          "absolute -left-2 top-1/2 z-10 -translate-y-1/2",
          "flex size-6 items-center justify-center rounded-full",
          "bg-background/80 text-muted-foreground/50",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:text-[var(--brand-sports)] hover:bg-background",
          "cursor-grab active:cursor-grabbing",
        )}
        aria-label="Харьцуулахын тулд чирнэ уу"
      >
        <GripVertical className="size-3" />
      </button>
      {children}
    </div>
  );
}
