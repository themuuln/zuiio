"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Profile } from "@/lib/database.types";
import { cn } from "@/lib/utils";

interface MechanicChipProps {
  mechanic: Profile & { current_jobs: number };
}

export function MechanicChip({ mechanic }: MechanicChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `mechanic-${mechanic.id}`,
      data: { type: "mechanic", mechanicId: mechanic.id },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const initials = mechanic.full_name
    ? mechanic.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const jobCount = mechanic.current_jobs;
  const isOverloaded = jobCount > 3;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card p-2 cursor-grab active:cursor-grabbing select-none transition-all touch-manipulation min-h-[46px]",
        isDragging && "opacity-50 shadow-xl",
        !isDragging && "hover:shadow-sm hover:border-primary/30",
        isOverloaded
          ? "border-red-400/50 bg-red-50/30 dark:bg-red-950/10"
          : "border-border",
      )}
    >
      <GripHorizontal className="size-5 text-muted-foreground/40 shrink-0" />
      <Avatar className="size-7 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isOverloaded
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              : "bg-primary/10 text-primary",
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">
          {mechanic.full_name ?? "Unknown"}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {jobCount === 0
            ? "Available"
            : `${jobCount} job${jobCount !== 1 ? "s" : ""}`}
        </div>
      </div>
      {jobCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center size-5 rounded-full text-[9px] font-semibold shrink-0",
            isOverloaded
              ? "bg-red-500 text-white"
              : jobCount > 1
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-primary/10 text-primary",
          )}
        >
          {jobCount}
        </div>
      )}
    </div>
  );
}
