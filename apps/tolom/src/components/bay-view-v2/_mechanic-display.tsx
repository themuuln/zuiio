"use client";

import { useDraggable } from "@dnd-kit/core";
import { User, UserPlus, X } from "lucide-react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { MechanicAvatarChip } from "@/components/mechanic-avatar-chip";
import { Button } from "@/components/ui/button";
import type { MechanicRef } from "@/lib/types/mechanic";
import type { BayCardMechanic } from "./_bay-card-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MechanicAssignSheet } from "./_mechanic-assign-drawer";
import { cn } from "@/lib/utils";

interface MechanicDisplayProps {
  variant: "badge" | "row";
  workOrderId: string;
  mechanic: MechanicRef | null;
  disabled?: boolean;
  status?: string;
  // Badge-only
  compact?: boolean;
  role?: "main" | "helper";
  onRemove?: () => void;
  // Row-only
  helpers?: MechanicRef[];
  allMechanics?: BayCardMechanic[];
  isPending?: boolean;
  rowVariant?: "default" | "preview";
  onRemoveHelper?: (woId: string, mechanicId: string) => void;
  onAssignMechanic?: (woId: string, mechanicId: string) => Promise<void>;
  onRemoveMechanic?: (woId: string) => Promise<void>;
  onAddHelper?: (woId: string, mechanicId: string) => Promise<void>;
}

export function MechanicDisplay({
  variant,
  workOrderId,
  mechanic,
  disabled = false,
  status,
  compact = false,
  role = "main",
  onRemove,
  helpers = [],
  allMechanics = [],
  isPending = false,
  rowVariant = "default",
  onRemoveHelper,
  onAssignMechanic,
  onRemoveMechanic,
  onAddHelper,
}: MechanicDisplayProps) {
  const isHelper = role === "helper";
  const isPreview = rowVariant === "preview";

  const dragResult = useDraggable({
    id: `mechanic-on-wo-${workOrderId}`,
    data: {
      type: "mechanic-assigned",
      workOrderId,
      mechanicId: mechanic?.id,
    },
    disabled: variant !== "badge" || !mechanic || disabled || isHelper,
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

  // ─── Badge variant ────────────────────────────────────────────

  if (variant === "badge") {
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
                            "border-blue-400/80 dark:border-blue-500/60 ring-1 ring-blue-200/50 dark:ring-blue-500/40",
                          status === "In Progress" &&
                            "border-teal-400/80 dark:border-teal-500/60 ring-1 ring-teal-200/50 dark:ring-teal-500/40",
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
              <span className="text-amber-400 font-semibold ml-1">
                (Helper)
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ─── Row variant ──────────────────────────────────────────────

  const handleUnassign = async (mechanicId: string) => {
    if (mechanic?.id === mechanicId) {
      await onRemoveMechanic?.(workOrderId);
    } else {
      onRemoveHelper?.(workOrderId, mechanicId);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MechanicDisplay
        variant="badge"
        workOrderId={workOrderId}
        mechanic={mechanic}
        disabled={isPending || disabled}
        role={isPreview ? undefined : "main"}
        status={status}
      />
      {!mechanic && (
        <span className="select-none text-xs font-bold text-muted-foreground/50">
          Unassigned tech
        </span>
      )}
      {!isPreview &&
        helpers.map((helper) => (
          <MechanicAvatarChip
            key={helper.id}
            mechanic={helper}
            size="sm"
            onRemove={
              onRemoveHelper
                ? () => onRemoveHelper(workOrderId, helper.id)
                : undefined
            }
          />
        ))}
      {!isPreview &&
        (onAssignMechanic || onAddHelper) &&
        allMechanics.length > 0 && (
          <MechanicAssignSheet
            trigger={
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full border border-dashed transition-all duration-200",
                  "text-muted-foreground/40 hover:text-primary hover:border-primary/50 hover:bg-primary/10",
                  "active:scale-95",
                )}
              >
                <UserPlus className="size-3" />
              </span>
            }
            mechanics={allMechanics}
            leadMechanicId={mechanic?.id ?? null}
            helpers={helpers}
            onAssignLead={async (mechanicId) => {
              await onAssignMechanic?.(workOrderId, mechanicId);
            }}
            onAssignHelper={async (mechanicId) => {
              await onAddHelper?.(workOrderId, mechanicId);
            }}
            onUnassign={handleUnassign}
            disabled={isPending}
          />
        )}
    </div>
  );
}
