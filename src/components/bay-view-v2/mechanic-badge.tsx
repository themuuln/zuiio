"use client";

import { useDraggable } from "@dnd-kit/core";
import { User, X } from "lucide-react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
                          "border-blue-400/80 dark:border-blue-500/60 ring-1 ring-blue-200/50 dark:ring-blue-500/40",
                        status === "Diagnosing" &&
                          "border-violet-400/80 dark:border-violet-500/60 ring-1 ring-violet-200/50 dark:ring-violet-500/40",
                        status === "In Progress" &&
                          "border-indigo-400/80 dark:border-indigo-500/60 ring-1 ring-indigo-200/50 dark:ring-indigo-500/40",
                        status === "Ready for Pickup" &&
                          "border-emerald-400/80 dark:border-emerald-500/60 ring-1 ring-emerald-200/50 dark:ring-emerald-500/40",
                        status === "Completed" &&
                          "border-emerald-500/80 dark:border-emerald-400/60 ring-1 ring-emerald-300/50 dark:ring-emerald-400/40",
                        !status &&
                          "border-slate-400/70 dark:border-slate-500/50 ring-1 ring-slate-200/40 dark:ring-slate-500/30",
                      ),
                  isDragging && "opacity-50 shadow-lg",
                  !isHelper &&
                    !isDragging &&
                    "hover:shadow-sm hover:border-primary/30",
                )}
              >
                <MechanicAvatar
                  mechanic={mechanic}
                  className={cn(compact ? "size-5" : "size-6", "shrink-0")}
                />
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
