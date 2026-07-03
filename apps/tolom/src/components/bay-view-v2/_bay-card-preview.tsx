"use client";

import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";
import { BayCardAccent } from "./_bay-card-accent";
import { BayCardVehicleInfo } from "./_bay-card-vehicle-info";
import { BayNumberLabel } from "./_bay-number-label";
import { BayStatusBadge } from "./_bay-status-badge";
import { MechanicsRow } from "./_mechanic-row";

interface BayCardPreviewProps {
  bay: BaySlotData;
  className?: string;
}

/** Elapsed minutes helper — mirrors the one in _bay-card-occupied */
function elapsedMinutes(startedAt: string | null | undefined): number | null {
  if (!startedAt) return null;
  const ms = Date.now() - new Date(startedAt).getTime();
  const mins = Math.round(ms / 60_000);
  return Number.isFinite(mins) && mins >= 0 ? mins : null;
}

export function BayCardPreview({ bay, className }: BayCardPreviewProps) {
  const wo = bay.workOrder;
  if (!wo) return null;

  const elapsed = elapsedMinutes(wo.started_at);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[180px] flex-col gap-0 overflow-hidden rounded-xl border border-border/70 bg-card py-0 shadow-2xl",
        className,
      )}
    >
      <BayCardAccent status={wo.status} elapsedMinutes={elapsed} />

      {/* Header — matches BayCardOccupied exactly */}
      <div className="flex select-none items-center justify-between py-2.5 pl-5 pr-3">
        <BayNumberLabel
          bayNumber={bay.bayNumber}
          className="text-foreground/80"
        />
        <BayStatusBadge status={wo.status} label={wo.status} />
      </div>

      <div className="h-px bg-border/40" />

      {/* Body — matches BayCardOccupied exactly */}
      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3">
        <BayCardVehicleInfo
          vehicle={wo.vehicle}
          startedAt={wo.started_at ?? wo.created_at}
        />
        <MechanicsRow
          woId={wo.id}
          leadMechanic={wo.mechanic}
          helpers={wo.helpers}
          status={wo.status}
          disabled
        />
      </div>

      <div className="h-px bg-border/40" />

      {/* Footer spacer — matches BayCardFooter height visually */}
      <div className="flex items-center gap-2 px-3 py-2.5" />
    </div>
  );
}
