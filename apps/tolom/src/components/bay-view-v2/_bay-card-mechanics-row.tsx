"use client";

import { UserPlus } from "lucide-react";
import { MechanicAvatarChip } from "@/components/mechanic-avatar-chip";
import { cn } from "@/lib/utils";
import type { BayCardMechanic, BayCardWorkOrder } from "./_bay-card-types";
import { MechanicAssignSheet } from "./_mechanic-assign-drawer";
import { MechanicDisplay } from "./_mechanic-display";

interface BayCardMechanicsRowProps {
  workOrder: BayCardWorkOrder;
  isPending?: boolean;
  disabled?: boolean;
  variant?: "default" | "preview";
  mechanics?: BayCardMechanic[];
  onRemoveHelper?: (woId: string, mechanicId: string) => void;
  onAssignMechanic?: (woId: string, mechanicId: string) => Promise<void>;
  onRemoveMechanic?: (woId: string) => Promise<void>;
  onAddHelper?: (woId: string, mechanicId: string) => Promise<void>;
}

export function BayCardMechanicsRow({
  workOrder,
  isPending = false,
  disabled = false,
  variant = "default",
  mechanics = [],
  onRemoveHelper,
  onAssignMechanic,
  onRemoveMechanic,
  onAddHelper,
}: BayCardMechanicsRowProps) {
  const isPreview = variant === "preview";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MechanicDisplay
        variant="badge"
        workOrderId={workOrder.id}
        mechanic={workOrder.mechanic}
        disabled={isPending || disabled}
        role={isPreview ? undefined : "main"}
        status={workOrder.status}
      />
      {!workOrder.mechanic && (
        <span className="select-none text-xs font-bold text-muted-foreground">
          Unassigned tech
        </span>
      )}
      {!isPreview &&
        workOrder.helpers.map((helper) => (
          <MechanicAvatarChip
            key={helper.id}
            mechanic={helper}
            size="sm"
            onRemove={
              onRemoveHelper
                ? () => onRemoveHelper(workOrder.id, helper.id)
                : undefined
            }
          />
        ))}
      {!isPreview &&
        (onAssignMechanic || onAddHelper) &&
        mechanics.length > 0 && (
          <MechanicAssignSheet
            trigger={
              <span
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full border border-dashed transition-all duration-200",
                  "text-muted-foreground/40 hover:text-primary hover:border-primary/50 hover:bg-primary/10",
                  "active:scale-95",
                )}
              >
                <UserPlus className="size-4" />
              </span>
            }
            mechanics={mechanics}
            leadMechanicId={workOrder.mechanic?.id ?? null}
            helpers={workOrder.helpers}
            onAssignLead={async (mechanicId) => {
              await onAssignMechanic?.(workOrder.id, mechanicId);
            }}
            onAssignHelper={async (mechanicId) => {
              await onAddHelper?.(workOrder.id, mechanicId);
            }}
            onUnassign={async (mechanicId) => {
              if (workOrder.mechanic?.id === mechanicId) {
                await onRemoveMechanic?.(workOrder.id);
              } else {
                onRemoveHelper?.(workOrder.id, mechanicId);
              }
            }}
            disabled={isPending}
          />
        )}
    </div>
  );
}
