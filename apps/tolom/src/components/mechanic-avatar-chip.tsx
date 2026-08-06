"use client";

import { Crown, X } from "lucide-react";
import type React from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MechanicRef } from "@/lib/types/mechanic";
import { cn } from "@/lib/utils";

export type { MechanicRef as ChipMechanic };

export interface MechanicAvatarChipProps {
  mechanic: MechanicRef;
  /** Show a crown icon for the lead mechanic */
  showLeadCrown?: boolean;
  /** Show a tooltip with the mechanic's name on hover (default: true) */
  showTooltip?: boolean;
  /** Chip size (default: "md") */
  size?: "sm" | "md";
  /** Additional class on the chip container */
  className?: string;
  /** Optional remove/close callback */
  onRemove?: () => void;
}

// ─── Chip ───────────────────────────────────────────────────────

const chipSizes = {
  sm: {
    container: "size-6",
    avatar: "size-5",
    crown: "size-3",
    crownIcon: "size-1.5",
  },
  md: {
    container: "size-7",
    avatar: "size-6",
    crown: "size-3.5",
    crownIcon: "size-2",
  },
};

export function MechanicAvatarChip({
  mechanic,
  showLeadCrown = false,
  showTooltip = true,
  size = "md",
  className,
  onRemove,
}: MechanicAvatarChipProps) {
  const sz = chipSizes[size];

  const renderChip = (props?: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      {...props}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-lg border  transition-colors",
        sz.container,
        showLeadCrown
          ? "border-amber-500/35 bg-amber-500/12"
          : "border-border/70 bg-muted/70",
        className,
      )}
    >
      <MechanicAvatar
        mechanic={mechanic}
        size={size === "sm" ? "sm" : "default"}
        className="shrink-0"
      />
      {showLeadCrown && (
        <span
          className={cn(
            "absolute -top-0.5 -left-0.5 flex items-center justify-center rounded-full bg-amber-500 text-amber-950 shadow-sm",
            sz.crown,
          )}
        >
          <Crown className={sz.crownIcon} />
        </span>
      )}
    </div>
  );

  if (!showTooltip) {
    return renderChip();
  }

  const chip = (
    <Tooltip>
      <TooltipTrigger render={(triggerProps) => renderChip(triggerProps)} />
      <TooltipContent side="top" sideOffset={6}>
        {mechanic.full_name ?? "Unknown"}
        {showLeadCrown && (
          <span className="ml-1 text-amber-400 font-semibold">(Lead)</span>
        )}
      </TooltipContent>
    </Tooltip>
  );

  if (onRemove) {
    return (
      <div className="flex items-center gap-0 group/chip">
        {chip}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "-ml-1 flex size-4 items-center justify-center rounded-full opacity-0 group-hover/chip:opacity-100 transition-opacity",
            "text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20",
          )}
        >
          <X className="size-2.5" />
        </button>
      </div>
    );
  }

  return <TooltipProvider delay={120}>{chip}</TooltipProvider>;
}

// ─── Group ──────────────────────────────────────────────────────

export interface MechanicAvatarGroupProps {
  mechanics: MechanicRef[];
  /** ID of the lead mechanic — gets a crown */
  leadId?: string | null;
  /** Max chips to show before "+N" overflow (default: 3) */
  limit?: number;
  /** Chip size (default: "md") */
  size?: "sm" | "md";
  /** Text shown when no mechanics are assigned */
  emptyPlaceholder?: string;
  /** Called when a chip's remove button is clicked */
  onRemove?: (mechanicId: string) => void;
  /** Additional class on the container */
  className?: string;
}

export function MechanicAvatarGroup({
  mechanics,
  leadId,
  limit = 3,
  size = "md",
  emptyPlaceholder,
  onRemove,
  className,
}: MechanicAvatarGroupProps) {
  const visible = mechanics.slice(0, limit);
  const hiddenCount = mechanics.length - visible.length;

  if (mechanics.length === 0 && emptyPlaceholder) {
    return (
      <span className="px-1 text-xs font-medium text-muted-foreground">
        {emptyPlaceholder}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {visible.map((m) => (
        <MechanicAvatarChip
          key={m.id}
          mechanic={m}
          showLeadCrown={m.id === leadId}
          size={size}
          onRemove={onRemove ? () => onRemove(m.id) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/60 text-[10px] font-semibold text-muted-foreground">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}
