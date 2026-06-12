"use client";

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
}: BayCardMechanicsRowProps) {
  const isPreview = variant === "preview";

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
      {!isPreview && onAssignMechanic && mechanics.length > 0 && (
        <MechanicQuickAssign
          _workOrderId={workOrder.id}
          currentMechanic={workOrder.mechanic}
          mechanics={mechanics}
          onAssign={async (mechanicId) => {
            await onAssignMechanic(workOrder.id, mechanicId);
          }}
          onRemove={
            workOrder.mechanic && onRemoveMechanic
              ? async () => {
                  await onRemoveMechanic(workOrder.id);
                }
              : undefined
          }
          disabled={isPending}
        />
      )}
    </div>
  );
}
