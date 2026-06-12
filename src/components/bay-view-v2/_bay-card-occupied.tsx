"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import type { BayCardProps } from "./_bay-card-types";
import { BayCardFooter } from "./_bay-card-footer";
import { BayCardMechanicsRow } from "./_bay-card-mechanics-row";
import { BayCardVehicleInfo } from "./_bay-card-vehicle-info";
import { BayNumberLabel } from "./_bay-number-label";
import { BayStatusBadge } from "./_bay-status-badge";
import { STATUS_TRANSLATION_KEYS } from "./_constants";

type BayCardOccupiedProps = Pick<
  BayCardProps,
  | "bay"
  | "isPending"
  | "isKanbanMode"
  | "mechanics"
  | "onStatusChange"
  | "onRemoveFromBay"
  | "onOpenDetail"
  | "onRemoveHelper"
  | "onPauseTimer"
  | "onAddNote"
  | "onQuickAddService"
  | "onQuickAddParts"
  | "onAssignMechanic"
  | "onRemoveMechanic"
>;

export function BayCardOccupied({
  bay,
  isPending = false,
  isKanbanMode = false,
  mechanics = [],
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  onRemoveHelper,
  onPauseTimer,
  onAddNote,
  onQuickAddService,
  onQuickAddParts,
  onAssignMechanic,
  onRemoveMechanic,
}: BayCardOccupiedProps) {
  const t = useTranslations("bayView");
  const wo = bay.workOrder;
  if (!wo) return null;

  return (
    <>
      <div className="flex select-none items-center justify-between py-2.5 pl-5 pr-3">
        <div className="flex items-center gap-2">
          <BayNumberLabel
            bayNumber={bay.bayNumber}
            className="text-foreground/80"
          />
          {isPending && (
            <Loader2 className="size-3 animate-spin text-muted-foreground/60" />
          )}
        </div>
        <BayStatusBadge
          status={wo.status}
          label={t(STATUS_TRANSLATION_KEYS[wo.status])}
        />
      </div>

      <Separator />

      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3">
        <BayCardVehicleInfo
          vehicle={wo.vehicle}
          startedAt={wo.started_at ?? wo.created_at}
          workOrderId={wo.id}
          draggable
          draggableDisabled={isPending || isKanbanMode}
        />
        <BayCardMechanicsRow
          workOrder={wo}
          isPending={isPending}
          mechanics={mechanics}
          onRemoveHelper={onRemoveHelper}
          onAssignMechanic={onAssignMechanic}
          onRemoveMechanic={onRemoveMechanic}
        />
      </div>

      <Separator />

      <BayCardFooter
        workOrder={wo}
        isPending={isPending}
        onStatusChange={onStatusChange}
        onRemoveFromBay={onRemoveFromBay}
        onOpenDetail={onOpenDetail}
        onPauseTimer={onPauseTimer}
        onAddNote={onAddNote}
        onQuickAddService={onQuickAddService}
        onQuickAddParts={onQuickAddParts}
      />
    </>
  );
}
