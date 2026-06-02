"use client";

import { useDraggable } from "@dnd-kit/core";
import { User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getMechanicColor, getMechanicInitials } from "@/lib/mechanic-colors";
import { cn } from "@/lib/utils";

interface MechanicBadgeProps {
  workOrderId: string;
  mechanic: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  disabled?: boolean;
  compact?: boolean;
  role?: "main" | "helper";
  onRemove?: () => void;
}

export function MechanicBadge({
  workOrderId,
  mechanic,
  disabled,
  compact = false,
  role = "main",
  onRemove,
}: MechanicBadgeProps) {
  const isHelper = role === "helper";

  const dragResult = useDraggable({
    id: `mechanic-on-wo-${workOrderId}`,
    data: {
      type: "mechanic-assigned",
      workOrderId,
      mechanicId: mechanic?.id,
    },
    disabled: !mechanic || disabled || isHelper,
  });

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    dragResult;

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
    <div className="flex items-center gap-0.5 group/badge">
      <div
        ref={!isHelper ? setNodeRef : undefined}
        {...(!isHelper ? listeners : {})}
        {...(!isHelper ? attributes : {})}
        style={!isHelper ? style : undefined}
        className={cn(
          "flex items-center select-none transition-all touch-manipulation",
          compact
            ? "gap-1 rounded-full border pl-0.5 pr-2 py-0.5 text-[10px]"
            : "gap-1.5 rounded-full border backdrop-blur-sm pl-1 pr-2.5 py-1 min-h-[32px]",
          isHelper
            ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40"
            : "bg-background/80 border-border/60 cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50 shadow-lg",
          !isHelper && !isDragging && "hover:shadow-sm hover:border-primary/30",
        )}
      >
        <Avatar
          className={cn(
            compact ? "size-5" : "size-6",
            "shrink-0",
            "after:hidden",
          )}
        >
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
        {isHelper && (
          <span className="text-[8px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 ml-0.5">
            H
          </span>
        )}
      </div>
      {isHelper && onRemove && (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="size-4 rounded-full opacity-0 group-hover/badge:opacity-100 transition-opacity text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <X className="size-2.5" />
        </Button>
      )}
    </div>
  );
}
