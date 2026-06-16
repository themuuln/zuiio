"use client";

import { UserPlus } from "lucide-react";
import { MechanicAvatarChip } from "@/components/mechanic-avatar-chip";
import type { BayCardMechanic } from "./_bay-card-types";
import { MechanicAssignSheet } from "./_mechanic-assign-sheet";
import { MechanicBadge } from "./mechanic-badge";
import { cn } from "@/lib/utils";

interface MechanicRowItem {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

interface MechanicsRowProps {
  /** Work order ID (used in callbacks) */
  woId: string;
  /** Lead mechanic (null if unassigned) */
  leadMechanic: MechanicRowItem | null;
  /** Helper mechanics assigned alongside the lead */
  helpers: MechanicRowItem[];
  /** Current work order status (affects badge display) */
  status?: string;
  /** Full list of available mechanics for the [add] sheet */
  allMechanics?: BayCardMechanic[];
  isPending?: boolean;
  disabled?: boolean;
  variant?: "default" | "preview";
  onRemoveHelper?: (woId: string, mechanicId: string) => void;
  onAssignMechanic?: (woId: string, mechanicId: string) => Promise<void>;
  onRemoveMechanic?: (woId: string) => Promise<void>;
  onAddHelper?: (woId: string, mechanicId: string) => Promise<void>;
}

export function MechanicsRow({
  woId,
  leadMechanic,
  helpers,
  status,
  allMechanics = [],
  isPending = false,
  disabled = false,
  variant = "default",
  onRemoveHelper,
  onAssignMechanic,
  onRemoveMechanic,
  onAddHelper,
}: MechanicsRowProps) {
  const isPreview = variant === "preview";

  const handleUnassign = async (mechanicId: string) => {
    if (leadMechanic?.id === mechanicId) {
      await onRemoveMechanic?.(woId);
    } else {
      onRemoveHelper?.(woId, mechanicId);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MechanicBadge
        workOrderId={woId}
        mechanic={
          leadMechanic as {
            id: string;
            full_name: string | null;
            avatar_url: string | null;
          } | null
        }
        disabled={isPending || disabled}
        role={isPreview ? undefined : "main"}
        status={status}
      />
      {!leadMechanic && (
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
              onRemoveHelper ? () => onRemoveHelper(woId, helper.id) : undefined
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
            leadMechanicId={leadMechanic?.id ?? null}
            helpers={helpers}
            onAssignLead={async (mechanicId) => {
              await onAssignMechanic?.(woId, mechanicId);
            }}
            onAssignHelper={async (mechanicId) => {
              await onAddHelper?.(woId, mechanicId);
            }}
            onUnassign={handleUnassign}
            disabled={isPending}
          />
        )}
    </div>
  );
}
