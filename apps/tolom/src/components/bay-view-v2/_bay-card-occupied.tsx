"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { BayCardFooter } from "./_bay-card-footer";
import type { BayCardProps } from "./_bay-card-types";
import { BayCardVehicleInfo } from "./_bay-card-vehicle-info";
import { BayNumberLabel } from "./_bay-number-label";
import { BayStatusBadge } from "./_bay-status-badge";
import { MechanicDisplay } from "./_mechanic-display";
import { useBayCardContext } from "./_bay-card-context";

import { STATUS_TRANSLATION_KEYS } from "./_constants";
import { elapsedMinutes } from "./_helpers";

/** Elapsed minutes helper */

interface BayCardOccupiedProps {
  bay: BayCardProps["bay"];
  isPending?: boolean;
  isKanbanMode?: boolean;
  mechanics?: BayCardProps["mechanics"];
}

export function BayCardOccupied({ bay }: BayCardOccupiedProps) {
  const t = useTranslations("bayView");
  const {
    isPending,
    isKanbanMode,
    mechanics,
    onRemoveHelper,
    onAssignMechanic,
    onRemoveMechanic,
    onAddHelper,
    onStatusChange,
    onRemoveFromBay,
    onOpenDetail,
    onPauseTimer,
    onAddNote,
    onQuickAddService,
    onQuickAddParts,
  } = useBayCardContext();
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
        <MechanicDisplay
          variant="row"
          workOrderId={wo.id}
          mechanic={wo.mechanic}
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

      <BayCardFooter workOrder={wo} isPending={isPending} />
    </>
  );
}
