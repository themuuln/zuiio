"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export function BayCardPreview({ bay, className }: BayCardPreviewProps) {
  const wo = bay.workOrder;
  if (!wo) return null;

  return (
    <Card
      className={cn(
        "relative flex min-h-[160px] w-[320px] flex-col gap-0 overflow-hidden border border-border/70 bg-card py-0 shadow-2xl",
        className,
      )}
    >
      <BayCardAccent status={wo.status} />

      <CardHeader className="flex w-full flex-row items-center justify-between border-b border-border/40 bg-muted/5 py-3 pl-4 pr-3 select-none">
        <BayNumberLabel
          bayNumber={bay.bayNumber}
          className="text-foreground/80"
        />
        <BayStatusBadge status={wo.status} label={wo.status} />
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
        <BayCardVehicleInfo
          vehicle={wo.vehicle}
          startedAt={wo.started_at ?? wo.created_at}
          showWatermark
          yearLayout="stacked"
        />

        <div className="flex items-center gap-2 border-t border-border/30 pt-2.5">
          <MechanicsRow
            woId={wo.id}
            leadMechanic={wo.mechanic}
            helpers={wo.helpers}
            status={wo.status}
            disabled
            variant="preview"
          />
        </div>
      </CardContent>
    </Card>
  );
}
