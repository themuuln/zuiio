"use client";

import { ArrowLeft, Maximize2, Minimize2, X } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { MongolianLicensePlate } from "@/components/vehicles/license-plate";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
import type { WorkOrderDetail } from "@/lib/types";
import { StatusPill } from "./_status-pill";

// ── Props ───────────────────────────────────────────────────────

interface DrawerHeaderProps {
  wo: WorkOrderDetail | null;
  loading: boolean;
  isFullScreen: boolean;
  showBack?: boolean;
  onToggleFullScreen: () => void;
  onClose: () => void;
  onBack?: () => void;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}

// ── Component ───────────────────────────────────────────────────

function DrawerHeaderSectionInner({
  wo,
  loading,
  isFullScreen,
  showBack,
  onToggleFullScreen,
  onClose,
  onBack,
  t,
}: DrawerHeaderProps) {
  return (
    <DrawerHeader className="shrink-0 border-b border-border/70 bg-card px-4 py-3 text-left">
      <DrawerTitle className="sr-only">
        {wo
          ? `${t("workOrder")} — ${wo.vehicle?.plate_number ?? wo.id?.slice(0, 8) ?? ""}`
          : t("workOrder")}
      </DrawerTitle>
      <DrawerDescription className="sr-only">
        {t("workOrderDrawerDescription")}
      </DrawerDescription>

      <div className="flex min-w-0 items-start justify-between gap-3">
        {/* Vehicle identity */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
            {loading ? (
              <Skeleton className="size-10 rounded-lg" />
            ) : (
              <VehicleMakeLogo
                make={wo?.vehicle?.make}
                size={20}
                className="text-primary"
              />
            )}
          </div>

          <div className="min-w-0">
            {loading ? (
              <>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="mt-1 h-3 w-36" />
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {wo?.vehicle?.plate_number ? (
                    <MongolianLicensePlate plate={wo.vehicle.plate_number} />
                  ) : (
                    <span className="text-sm font-semibold">
                      {t("workOrder")}
                    </span>
                  )}
                  {wo?.status && <StatusPill status={wo.status} />}
                </div>
                <p className="mt-0.5 truncate text-xs font-medium text-foreground/85">
                  {wo?.vehicle
                    ? `${wo.vehicle.make} ${wo.vehicle.model}${wo.vehicle.year ? ` · ${wo.vehicle.year}` : ""}`
                    : t("workOrder")}
                  {wo?.id && (
                    <>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="font-mono font-normal text-muted-foreground">
                        WO#{wo.id.slice(0, 8)}
                      </span>
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {showBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              aria-label={t("backLabel")}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          {!showBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleFullScreen}
              aria-label={isFullScreen ? t("exitFullscreen") : t("fullscreen")}
            >
              {isFullScreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </DrawerHeader>
  );
}

export const DrawerHeaderSection = memo(DrawerHeaderSectionInner);
