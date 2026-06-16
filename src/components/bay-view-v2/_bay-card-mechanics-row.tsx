"use client";

import { useCallback } from "react";
import { MechanicAvatarChip } from "@/components/mechanic-avatar-chip";
import type { BayCardMechanic, BayCardWorkOrder } from "./_bay-card-types";
import { MechanicQuickAssign } from "./_mechanic-quick-assign";
import { MechanicBadge } from "./mechanic-badge";

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

  const handleUnassign = useCallback(
    async (mechanicId: string) => {
      if (workOrder.mechanic?.id === mechanicId) {
        await onRemoveMechanic?.(workOrder.id);
      } else {
        onRemoveHelper?.(workOrder.id, mechanicId);
      }
    },
    [workOrder.id, workOrder.mechanic?.id, onRemoveMechanic, onRemoveHelper],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MechanicBadge
        workOrderId={workOrder.id}
        mechanic={workOrder.mechanic}
        disabled={isPending || disabled}
        role={isPreview ? undefined : "main"}
        status={workOrder.status}
      />
      {!workOrder.mechanic && (
        <span className="select-none text-xs font-bold text-muted-foreground/50">
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
          <MechanicQuickAssign
            currentMechanic={workOrder.mechanic}
            mechanics={mechanics}
            helperMechanics={workOrder.helpers}
            hasLeadMechanic={!!workOrder.mechanic}
            onAssignLead={
              onAssignMechanic
                ? async (mechanicId) => {
                    await onAssignMechanic(workOrder.id, mechanicId);
                  }
                : async () => {}
            }
            onAssignHelper={
              onAddHelper
                ? async (mechanicId) => {
                    await onAddHelper(workOrder.id, mechanicId);
                  }
                : async () => {}
            }
            onUnassign={
              onRemoveHelper || onRemoveMechanic
                ? async (mechanicId) => {
                    await handleUnassign(mechanicId);
                  }
                : undefined
            }
            disabled={isPending}
          />
        )}
    </div>
  );
}
