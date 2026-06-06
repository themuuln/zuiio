"use client";

import {
  ArrowLeft,
  Loader2,
  Maximize2,
  Minimize2,
  User,
  X,
} from "lucide-react";
import { MechanicMultiSelect } from "@/components/bay-view-v2/_mechanic-multi-select";
import { Button } from "@/components/ui/button";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MongolianLicensePlate } from "@/components/vehicles/license-plate";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
import type { WorkOrderDetail } from "@/lib/types";
import { StatusPill } from "./status-pill";

interface DrawerHeaderProps {
  wo: WorkOrderDetail | null;
  loading: boolean;
  mechanics: Array<{ id: string; full_name: string; current_jobs?: number }>;
  helpers: Array<{ id: string; full_name?: string | null | undefined }>;
  orgId: string;
  workOrderId: string;
  saving: boolean;
  isAddingService: boolean;
  isFullScreen: boolean;
  onAssignMechanic: (mechanicId: string) => Promise<void>;
  onHelpersChange: () => void;
  onToggleFullScreen: () => void;
  onClose: () => void;
  showBack?: boolean;
  onBack?: () => void;
  setShowCustomerPicker?: (v: boolean) => void;
  t: (key: string) => string;
}

export function DrawerHeaderSection({
  wo,
  loading,
  mechanics,
  helpers,
  orgId,
  workOrderId,
  saving,
  isAddingService,
  isFullScreen,
  onAssignMechanic,
  onHelpersChange,
  onToggleFullScreen,
  onClose,
  showBack,
  onBack,
  setShowCustomerPicker,
  t,
}: DrawerHeaderProps) {
  // Ensure the assigned mechanic is always in the list, even if they
  // don't have the "mechanic" role in organization_users.
  const effectiveMechanics = (() => {
    if (!wo?.mechanic_id || !wo.mechanic) return mechanics;
    const alreadyIncluded = mechanics.some((m) => m.id === wo.mechanic_id);
    if (alreadyIncluded) return mechanics;
    return [
      { id: wo.mechanic.id, full_name: wo.mechanic.full_name ?? "Unknown" },
      ...mechanics,
    ];
  })();

  return (
    <DrawerHeader className="border-b border-border px-4 py-3 text-left shrink-0 bg-muted/5">
      <DrawerTitle className="sr-only">
        {wo
          ? `Work Order — ${wo.vehicle?.plate_number ?? wo.id.slice(0, 8)}`
          : "Work Order"}
      </DrawerTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center justify-between">
        {/* Column 1: Vehicle & WO Info */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            {loading ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <VehicleMakeLogo
                make={wo?.vehicle?.make}
                size={20}
                className="text-primary"
              />
            )}
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {wo?.vehicle?.plate_number ? (
                <MongolianLicensePlate plate={wo.vehicle.plate_number} />
              ) : (
                <span className="font-bold text-sm">{t("workOrder")}</span>
              )}
              {wo && (
                <span className="font-mono text-xs text-muted-foreground/80 font-medium">
                  WO#{wo.id.slice(0, 8)}
                </span>
              )}
              {isAddingService && (
                <Loader2 className="size-3 animate-spin text-primary" />
              )}
            </div>
            {wo?.vehicle && (
              <div className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                <span>
                  {wo.vehicle.make} {wo.vehicle.model}
                </span>
                {wo.vehicle.year && (
                  <span className="text-muted-foreground/60 font-normal">
                    ({wo.vehicle.year})
                  </span>
                )}
              </div>
            )}
            {wo?.created_at && (
              <span className="text-xs text-muted-foreground/60 mt-1">
                Opened {new Date(wo.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Customer Info */}
        <div className="min-w-0 md:justify-self-center">
          {wo?.customer ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-foreground/80 font-bold">
                <User className="size-4 text-muted-foreground/75" />
                <span>
                  {[wo.customer.first_name, wo.customer.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                    wo.customer.phone ||
                    "Unknown"}
                </span>
              </div>
              {wo.customer.phone &&
                [wo.customer.first_name, wo.customer.last_name]
                  .filter(Boolean)
                  .join(" ") && (
                  <span className="text-xs text-muted-foreground font-semibold pl-5 font-mono">
                    {wo.customer.phone}
                  </span>
                )}
            </div>
          ) : wo ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setShowCustomerPicker?.(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground italic hover:text-foreground transition-colors pl-1"
              >
                <User className="size-4 text-muted-foreground/75" />
                Select customer...
              </button>
            </div>
          ) : null}
        </div>

        {/* Column 3: Status & Mechanic Assignment */}
        <div className="flex items-center md:justify-end gap-3 flex-wrap">
          {wo && orgId && workOrderId && (
            <MechanicMultiSelect
              leadMechanicId={wo.mechanic_id}
              leadMechanicName={wo.mechanic?.full_name ?? null}
              helpers={helpers}
              mechanics={effectiveMechanics}
              orgId={orgId}
              workOrderId={workOrderId}
              saving={saving}
              onLeadChange={onAssignMechanic}
              onHelpersChange={onHelpersChange}
            />
          )}
          {showBack ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>
          ) : (
            <>
              {wo?.status && <StatusPill status={wo.status} />}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onToggleFullScreen}
                aria-label={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullScreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onClose}
                aria-label={t("close")}
              >
                <X className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </DrawerHeader>
  );
}
