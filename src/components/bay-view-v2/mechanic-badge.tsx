"use client";

import { useDraggable } from "@dnd-kit/core";
import { User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  status?: string;
  onRemove?: () => void;
}

export function MechanicBadge({
  workOrderId,
  mechanic,
  disabled,
  compact = false,
  role = "main",
  status,
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
        <User className={cn(compact ? "size-3" : "size-4")} />
      </div>
    );
  }

  const color = getMechanicColor(mechanic.id);
  const initials = getMechanicInitials(mechanic.full_name);
  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <div {...props} className="flex items-center gap-1 group/badge">
              <div
                ref={!isHelper ? setNodeRef : undefined}
                {...(!isHelper ? listeners : {})}
                {...(!isHelper ? attributes : {})}
                style={!isHelper ? style : undefined}
                className={cn(
                  "flex items-center select-none transition-all touch-manipulation",
                  compact
                    ? "gap-1 rounded-full border p-1 text-xs"
                    : "gap-2 rounded-full border backdrop-blur-sm p-1 min-h-[32px]",
                  isHelper
                    ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40"
                    : cn(
                        "bg-background/80 cursor-grab active:cursor-grabbing",
                        status === "New" &&
                          "border-blue-400/60 dark:border-blue-500/40 ring-1 ring-blue-200/40 dark:ring-blue-500/30",
                        status === "Diagnosing" &&
                          "border-indigo-400/60 dark:border-indigo-500/40 ring-1 ring-indigo-200/40 dark:ring-indigo-500/30",
                        status === "In Progress" &&
                          "border-indigo-500/60 dark:border-indigo-400/40 ring-1 ring-indigo-300/40 dark:ring-indigo-400/30",
                        status === "Ready for Pickup" &&
                          "border-emerald-400/60 dark:border-emerald-500/40 ring-1 ring-emerald-200/40 dark:ring-emerald-500/30",
                        status === "Completed" &&
                          "border-emerald-500/60 dark:border-emerald-400/40 ring-1 ring-emerald-300/40 dark:ring-emerald-400/30",
                        !status &&
                          "border-cyan-300/60 dark:border-cyan-600/40 ring-1 ring-cyan-200/40 dark:ring-cyan-600/30",
                      ),
                  isDragging && "opacity-50 shadow-lg",
                  !isHelper &&
                    !isDragging &&
                    "hover:shadow-sm hover:border-primary/30",
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
                      compact ? "text-xs" : "text-xs",
                      "font-medium",
                      color.bg,
                      color.text,
                    )}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isHelper && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
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
                  <X className="size-3" />
                </Button>
              )}
            </div>
          )}
        />
        <TooltipContent side="top" sideOffset={4}>
          <span>{mechanic.full_name ?? "Unknown"}</span>
          {isHelper && (
            <span className="text-amber-400 font-semibold ml-1">(Helper)</span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
