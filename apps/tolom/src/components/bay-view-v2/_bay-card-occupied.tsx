"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { useBayCardContext } from "./_bay-card-context";
import { BayCardFooter } from "./_bay-card-footer";
import type { BayCardProps } from "./_bay-card-types";
import { BayCardVehicleInfo } from "./_bay-card-vehicle-info";
import { BayNumberLabel } from "./_bay-number-label";
import { BayStatusBadge } from "./_bay-status-badge";
import { STATUS_TRANSLATION_KEYS } from "./_constants";
import { elapsedMinutes } from "./_helpers";
import { MechanicDisplay } from "./_mechanic-display";

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
  } = useBayCardContext();
  const wo = bay.workOrder;
  if (!wo) return null;

  const elapsed = elapsedMinutes(wo.started_at);
  const isStuck = elapsed != null && elapsed > 120;
  const isCritical = elapsed != null && elapsed > 180;
  return (
    <>
      {/* ── Header: Bay number + Status + Elapsed ── */}
      <div className="flex select-none items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <BayNumberLabel
            bayNumber={bay.bayNumber}
            className="text-sm font-semibold text-foreground/80"
          />
          {isPending && (
            <Loader2 className="size-3 animate-spin text-muted-foreground/60" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isStuck && (
            <span
              title={
                isCritical ? "Over 3 hours in bay!" : "Over 2 hours in bay"
              }
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isCritical
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              <AlertTriangle className="size-3" />
              {isCritical ? "3h+" : "2h+"}
            </span>
          )}
          <BayStatusBadge
            status={wo.status}
            label={t(STATUS_TRANSLATION_KEYS[wo.status])}
          />
        </div>
      </div>

      <Separator />

      {/* ── Content: Vehicle + Mechanic (compact) ── */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        <BayCardVehicleInfo
          vehicle={wo.vehicle}
          startedAt={wo.started_at ?? wo.created_at}
          workOrderId={wo.id}
          draggable
          draggableDisabled={isPending || isKanbanMode}
          showWatermark
          yearLayout="inline"
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

      {/* ── Footer: Customer (one line) + Actions ── */}
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {wo.customer_name ?? "—"}
        </span>
        <BayCardFooter workOrder={wo} isPending={isPending} />
      </div>
    </>
  );
}
