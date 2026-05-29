"use client";

import { useDraggable } from "@dnd-kit/core";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getMechanicColor, getMechanicInitials } from "@/lib/mechanic-colors";

interface MechanicBadgeProps {
  workOrderId: string;
  mechanic: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  disabled?: boolean;
  compact?: boolean;
}

export function MechanicBadge({
  workOrderId,
  mechanic,
  disabled,
  compact = false,
}: MechanicBadgeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `mechanic-on-wo-${workOrderId}`,
      data: {
        type: "mechanic-assigned",
        workOrderId,
        mechanicId: mechanic?.id,
      },
      disabled: !mechanic || disabled,
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
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted/30 text-muted-foreground/40",
          compact ? "size-6" : "size-8",
        )}
      >
        <User className={cn(compact ? "size-3" : "size-3.5")} />
      </div>
    );
  }

  const color = getMechanicColor(mechanic.id);
  const shortName = (() => {
    if (!mechanic.full_name) return "?";
    const parts = mechanic.full_name.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] ?? "?";
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
  })();
  const initials = getMechanicInitials(mechanic.full_name);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "flex items-center select-none transition-all touch-manipulation",
        compact
          ? "gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-0.5 text-[10px] cursor-grab active:cursor-grabbing"
          : "gap-1.5 rounded-full border border-border/60 bg-background/80 backdrop-blur-sm px-2.5 py-1 cursor-grab active:cursor-grabbing min-h-[32px]",
        isDragging && "opacity-50 shadow-lg",
        !isDragging && "hover:shadow-sm hover:border-primary/30",
      )}
    >
      <Avatar className={cn(compact ? "size-5" : "size-6", "shrink-0")}>
        {mechanic.avatar_url && (
          <AvatarImage src={mechanic.avatar_url} alt="" />
        )}
        <AvatarFallback
          className={cn(
            compact ? "text-[8px]" : "text-xs",
            "font-medium",
            color.bg,
            color.text,
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          compact ? "text-[10px] max-w-[80px]" : "text-xs max-w-[110px]",
          "font-medium truncate",
        )}
      >
        {shortName}
      </span>
    </div>
  );
}
