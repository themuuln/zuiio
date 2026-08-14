import { Typography } from "@/components/ui/typography";
import { MongolianLicensePlate } from "@/components/vehicles/license-plate";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
import type { Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DraggableVehicleWrapper } from "./_draggable-vehicle-wrapper";
import { ElapsedTimer } from "./_elapsed-display";

interface BayCardVehicleInfoProps {
  vehicle: Vehicle | null | undefined;
  startedAt: string | null;
  workOrderId?: string;
  draggable?: boolean;
  draggableDisabled?: boolean;
  showWatermark?: boolean;
  yearLayout?: "inline" | "stacked";
  className?: string;
}

export function BayCardVehicleInfo({
  vehicle,
  startedAt,
  workOrderId,
  draggable = false,
  draggableDisabled = false,
  showWatermark = false,
  yearLayout = "inline",
  className,
}: BayCardVehicleInfoProps) {
  const content = (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-1 text-left",
        yearLayout === "stacked" && "gap-2",
        className,
      )}
    >
      {showWatermark && (
        <VehicleMakeLogo
          make={vehicle?.make}
          size="85%"
          className="pointer-events-none absolute inset-0 m-auto select-none text-primary/[0.02]"
          aria-hidden
        />
      )}
      {vehicle ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <MongolianLicensePlate plate={vehicle.plate_number} />
            <ElapsedTimer startedAt={startedAt} />
          </div>
          {yearLayout === "inline" ? (
            <span className="truncate text-sm font-bold text-foreground/95">
              {vehicle.make} {vehicle.model}
              {vehicle.year ? ` · ${vehicle.year}` : ""}
            </span>
          ) : (
            <div className="flex flex-col">
              <span className="truncate text-sm font-bold text-foreground/95">
                {vehicle.make} {vehicle.model}
              </span>
              {vehicle.year && (
                <span className="text-xs font-semibold text-muted-foreground">
                  Year: {vehicle.year}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <Typography.Muted className="text-xs italic leading-none text-muted-foreground">
          No vehicle data
        </Typography.Muted>
      )}
    </div>
  );

  if (draggable && workOrderId) {
    return (
      <DraggableVehicleWrapper
        workOrderId={workOrderId}
        disabled={draggableDisabled}
      >
        {content}
      </DraggableVehicleWrapper>
    );
  }

  return content;
}
