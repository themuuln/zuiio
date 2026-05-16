"use client";

import { useDraggable } from "@dnd-kit/core";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MechanicBadgeProps {
  workOrderId: string;
  mechanic: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function MechanicBadge({ workOrderId, mechanic }: MechanicBadgeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `mechanic-on-wo-${workOrderId}`,
      data: {
        type: "mechanic-assigned",
        workOrderId,
        mechanicId: mechanic?.id,
      },
      disabled: !mechanic,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        willChange: "transform",
      }
    : undefined;

  if (!mechanic) {
    return (
      <div className="flex items-center justify-center size-8 rounded-full bg-muted/30 text-muted-foreground/40">
        <User className="size-3.5" />
      </div>
    );
  }

  const initials = mechanic.full_name
    ? mechanic.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 backdrop-blur-sm px-2.5 py-1 cursor-grab active:cursor-grabbing select-none transition-all touch-manipulation min-h-[32px]",
        isDragging && "opacity-50 shadow-lg",
        !isDragging && "hover:shadow-sm hover:border-primary/30",
      )}
    >
      <Avatar className="size-6 shrink-0">
        {mechanic.avatar_url && (
          <AvatarImage src={mechanic.avatar_url} alt="" />
        )}
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium truncate max-w-[110px]">
        {mechanic.full_name}
      </span>
    </div>
  );
}
