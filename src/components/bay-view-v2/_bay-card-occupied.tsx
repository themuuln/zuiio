"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { BayCardFooter } from "./_bay-card-footer";
import type { BayCardProps } from "./_bay-card-types";
import { BayCardVehicleInfo } from "./_bay-card-vehicle-info";
import { BayNumberLabel } from "./_bay-number-label";
import { BayStatusBadge } from "./_bay-status-badge";
import { MechanicsRow } from "./_mechanic-row";
import { STATUS_TRANSLATION_KEYS } from "./_constants";

/** Elapsed minutes helper */
function elapsedMinutes(startedAt: string | null | undefined): number | null {
  if (!startedAt) return null;
  const ms = Date.now() - new Date(startedAt).getTime();
  const mins = Math.round(ms / 60_000);
  return Number.isFinite(mins) && mins >= 0 ? mins : null;
}

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
  | "onAddHelper"
  | "onReorderMechanics"
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
  onAddHelper,
}: BayCardOccupiedProps) {
  const t = useTranslations("bayView");
  const wo = bay.workOrder;
  if (!wo) return null;

  const elapsed = elapsedMinutes(wo.started_at);
  const isStuck = elapsed != null && elapsed > 120;
  const isCritical = elapsed != null && elapsed > 180;

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
        <div className="flex items-center gap-1.5">
          {isStuck && (
            <span
              title={
                isCritical ? "Over 3 hours in bay!" : "Over 2 hours in bay"
              }
              className={`inline-flex size-5 cursor-default items-center justify-center rounded-full ${
                isCritical
                  ? "bg-rose-500/10 text-rose-500"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              <AlertTriangle className="size-3 animate-pulse" />
            </span>
          )}
          <BayStatusBadge
            status={wo.status}
            label={t(STATUS_TRANSLATION_KEYS[wo.status])}
          />
        </div>
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
        <MechanicsRow
          woId={wo.id}
          leadMechanic={wo.mechanic}
          helpers={wo.helpers}
          status={wo.status}
          allMechanics={mechanics}
          isPending={isPending}
          onRemoveHelper={onRemoveHelper}
          onAssignMechanic={onAssignMechanic}
          onRemoveMechanic={onRemoveMechanic}
          onAddHelper={onAddHelper}
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
