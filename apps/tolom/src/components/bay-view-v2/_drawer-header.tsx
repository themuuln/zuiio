"use client";

import { useOrgMutation } from "@zuiio/query";
import {
  ArrowLeft,
  Loader2,
  Maximize2,
  Minimize2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { MechanicDisplay } from "@/components/bay-view-v2/_mechanic-display";
import { Button } from "@/components/ui/button";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { MongolianLicensePlate } from "@/components/vehicles/license-plate";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
import { workOrderKeys } from "@/lib/queries/keys";
import { reportServerError } from "@/lib/sentry-report-server";
import type { WorkOrderDetail } from "@/lib/types";
import type { MechanicRef } from "@/lib/types/mechanic";
import { StatusPill } from "./_status-pill";

interface DrawerHeaderProps {
  wo: WorkOrderDetail | null;
  loading: boolean;
  mechanics: Array<{ id: string; full_name: string }>;
  helpers: MechanicRef[];
  orgId: string;
  workOrderId: string;
  saving: boolean;
  isAddingService: boolean;
  isFullScreen: boolean;
  onAssignMechanic: (
    mechanicId: string,
    fullName?: string | null,
  ) => Promise<void>;
  onHelpersChange: () => void;
  onToggleFullScreen: () => void;
  onClose: () => void;
  showBack?: boolean;
  onBack?: () => void;
  onShowCustomerPicker: () => void;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}

function DrawerHeaderSectionInner({
  wo,
  loading,
  mechanics,
  helpers,
  orgId,
  workOrderId,
  saving: _saving,
  isAddingService,
  isFullScreen,
  onAssignMechanic,
  onHelpersChange,
  onToggleFullScreen,
  onClose,
  showBack,
  onBack,
  onShowCustomerPicker,
  t,
}: DrawerHeaderProps) {
  // ── Mutation hooks for helper operations ──

  const addHelperMutation = useOrgMutation<unknown, { mechanic_id: string }>({
    endpoint: () =>
      `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
    method: "POST",
    queryKey: workOrderKeys.all(orgId),
    onSuccess: () => {
      onHelpersChange();
    },
  });

  const removeHelperMutation = useOrgMutation<unknown, { mechanicId: string }>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers?mechanicId=${vars.mechanicId}`,
    method: "DELETE",
    queryKey: workOrderKeys.all(orgId),
    onSuccess: () => {
      onHelpersChange();
    },
  });

  // Ensure the assigned mechanic is always in the list, even if they
  // don't have the "mechanic" role in organization_users.
  const effectiveMechanics = useMemo(() => {
    if (!wo?.mechanic_id || !wo.mechanic) return mechanics;
    const alreadyIncluded = mechanics.some((m) => m.id === wo.mechanic_id);
    if (alreadyIncluded) return mechanics;
    return [
      {
        id: wo.mechanic.id,
        full_name: wo.mechanic.full_name ?? t("unknownCustomer"),
      },
      ...mechanics,
    ];
  }, [wo?.mechanic_id, wo?.mechanic, mechanics, t]);
  // ── Stable callbacks for MechanicDisplay ──
  const handleAssignMechanic = useCallback(
    async (_woId: string, mechanicId: string) => {
      const mech = effectiveMechanics.find((m) => m.id === mechanicId);
      await onAssignMechanic(mechanicId, mech?.full_name);
    },
    [effectiveMechanics, onAssignMechanic],
  );

  const handleAddHelper = useCallback(
    async (_woId: string, mechanicId: string) => {
      try {
        await addHelperMutation.mutateAsync({ mechanic_id: mechanicId });
      } catch (err) {
        reportServerError("Failed to add helper", err);
        toast.error("Failed to add helper");
      }
    },
    [addHelperMutation],
  );

  const handleRemoveMechanic = useCallback(
    async (_woId: string) => {
      try {
        await removeHelperMutation.mutateAsync({
          mechanicId: wo?.mechanic?.id ?? "",
        });
      } catch (err) {
        reportServerError("Failed to remove mechanic", err);
        toast.error("Failed to remove mechanic");
      }
    },
    [removeHelperMutation, wo?.mechanic?.id],
  );

  const handleRemoveHelper = useCallback(
    async (_woId: string, mechanicId: string) => {
      try {
        await removeHelperMutation.mutateAsync({ mechanicId });
      } catch (err) {
        reportServerError("Failed to remove helper", err);
        toast.error("Failed to remove helper");
      }
    },
    [removeHelperMutation],
  );

  return (
    <DrawerHeader className="border-b border-border px-3 py-2.5 text-left shrink-0">
      <DrawerTitle className="sr-only">
        {wo
          ? `${t("workOrder")} — ${wo.vehicle?.plate_number ?? wo.id?.slice(0, 8) ?? ""}`
          : t("workOrder")}
      </DrawerTitle>
      <DrawerDescription className="sr-only">
        {t("workOrderDrawerDescription")}
      </DrawerDescription>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        {/* Left: Vehicle */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-muted ring-1 ring-border">
            {loading ? (
              <Skeleton className="size-10 rounded-xl" />
            ) : (
              <VehicleMakeLogo
                make={wo?.vehicle?.make}
                size={20}
                className="text-primary"
              />
            )}
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            {loading ? (
              <>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-3.5 w-14 rounded-sm" />
                </div>
                <Skeleton className="h-3 w-28" />
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {wo?.vehicle?.plate_number ? (
                    <MongolianLicensePlate plate={wo.vehicle.plate_number} />
                  ) : (
                    <span className="font-bold text-sm">{t("workOrder")}</span>
                  )}
                  {wo && (
                    <span className="font-mono text-xs text-muted-foreground/80 font-medium">
                      WO#{wo.id?.slice(0, 8) ?? ""}
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
              </>
            )}
          </div>
        </div>

        {/* Center: Customer */}
        {loading ? (
          <div className="flex items-center gap-2 justify-center">
            <Skeleton className="size-3.5 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        ) : wo ? (
          <div className="flex items-center gap-2 min-w-0 justify-center">
            {wo.customer ? (
              <>
                <User className="size-3.5 text-muted-foreground/60 shrink-0" />
                <span className="font-medium text-xs text-foreground/80 truncate">
                  {[wo.customer.first_name, wo.customer.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                    wo.customer.phone ||
                    t("unknownCustomer")}
                </span>
                {wo.customer.phone &&
                  [wo.customer.first_name, wo.customer.last_name]
                    .filter(Boolean)
                    .join(" ") && (
                    <span className="text-muted-foreground/60 font-mono text-xs">
                      {wo.customer.phone}
                    </span>
                  )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onShowCustomerPicker}
                  aria-label={t("selectCustomer")}
                >
                  <UserPlus className="size-3" />
                </Button>
              </>
            ) : (
              <button
                type="button"
                onClick={onShowCustomerPicker}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <UserPlus className="size-3.5" />
                {t("selectCustomer")}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-center">
            <Skeleton className="size-3.5 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        )}

        {/* Right: Mechanic + Status + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {wo && orgId && workOrderId && (
            <MechanicDisplay
              variant="row"
              workOrderId={workOrderId}
              mechanic={wo.mechanic}
              helpers={helpers as MechanicRef[]}
              status={wo.status}
              allMechanics={effectiveMechanics}
              onAssignMechanic={handleAssignMechanic}
              onAddHelper={handleAddHelper}
              onRemoveMechanic={handleRemoveMechanic}
              onRemoveHelper={handleRemoveHelper}
            />
          )}
          <div className="flex items-center gap-2 shrink-0">
            {showBack && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onBack}
                aria-label={t("backLabel")}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            {wo?.status && <StatusPill status={wo.status} />}
            {!showBack && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onToggleFullScreen}
                aria-label={
                  isFullScreen ? t("exitFullscreen") : t("fullscreen")
                }
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
              size="icon-xs"
              onClick={onClose}
              aria-label={t("close")}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </DrawerHeader>
  );
}
export const DrawerHeaderSection = memo(DrawerHeaderSectionInner);
