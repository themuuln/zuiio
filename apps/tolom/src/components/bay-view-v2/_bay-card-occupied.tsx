"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("bayView") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
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
      <header className="flex min-h-12 select-none items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <BayNumberLabel
            bayNumber={bay.bayNumber}
            className="text-xs text-foreground/70"
          />
          {isPending && (
            <Loader2 className="size-3 animate-spin text-muted-foreground/60" />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isStuck && (
            <span
              role="img"
              aria-label={t("bayOverTime", {
                hours: isCritical ? 3 : 2,
              })}
              className={isCritical ? "text-destructive" : "text-warning"}
            >
              <AlertTriangle className="size-4" />
            </span>
          )}
          <BayStatusBadge
            status={wo.status}
            label={t(STATUS_TRANSLATION_KEYS[wo.status])}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 px-4 py-4 sm:px-5">
        <BayCardVehicleInfo
          vehicle={wo.vehicle}
          startedAt={wo.started_at ?? wo.created_at}
          workOrderId={wo.id}
          draggable
          draggableDisabled={isPending || isKanbanMode}
          yearLayout="inline"
          className="gap-2"
        />

        <div className="flex min-w-0 items-center gap-3 border-t border-border/50 pt-3.5">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("listHeaderMechanic")}
          </span>
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
      </div>

      <footer className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("listHeaderCustomer")}
          </p>
          <p
            className="truncate text-sm font-medium text-foreground/85"
            title={wo.customer_name ?? undefined}
          >
            {wo.customer_name ?? "—"}
          </p>
        </div>
        <BayCardFooter workOrder={wo} isPending={isPending} />
      </footer>
    </>
  );
}
