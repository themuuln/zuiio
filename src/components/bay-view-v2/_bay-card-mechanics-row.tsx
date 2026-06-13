"use client";

import { useCallback } from "react";
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
  onReorderMechanics?: (
    woId: string,
    orderedMechanicIds: string[],
  ) => Promise<void>;
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
  onReorderMechanics,
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
          <MechanicBadge
            key={helper.id}
            workOrderId={workOrder.id}
            mechanic={helper}
            disabled={isPending}
            compact
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
            onReorder={
              onReorderMechanics
                ? async (orderedIds) => {
                    await onReorderMechanics(workOrder.id, orderedIds);
                  }
                : undefined
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
