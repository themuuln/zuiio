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
                  {isAddingService && (
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs font-medium text-foreground/85">
                  {wo?.vehicle
                    ? `${wo.vehicle.make} ${wo.vehicle.model}${wo.vehicle.year ? ` · ${wo.vehicle.year}` : ""}`
                    : t("workOrder")}
                  {wo?.id && (
                    <span className="ml-2 font-mono font-normal text-muted-foreground">
                      WO#{wo.id.slice(0, 8)}
                    </span>
                  )}
                </p>
              </>
            )}
          </div>
        </div>

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

      <div className="mt-3 grid gap-2 border-t border-border/60 pt-2.5 sm:grid-cols-2">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </>
        ) : wo ? (
          <>
            <button
              type="button"
              onClick={onShowCustomerPicker}
              className="group flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <User className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium text-muted-foreground">
                  {t("listHeaderCustomer")}
                </span>
                <span className="block truncate text-xs font-medium text-foreground">
                  {wo?.customer
                    ? [wo.customer.first_name, wo.customer.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      wo.customer.phone ||
                      t("unknownCustomer")
                    : t("selectCustomer")}
                </span>
              </span>
              <UserPlus className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </button>

            <div className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1.5">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium text-muted-foreground">
                  {t("listHeaderMechanic")}
                </span>
                {wo && orgId && workOrderId ? (
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
                ) : (
                  <span className="block text-xs text-muted-foreground">
                    {t("unassigned")}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DrawerHeader>
  );
}
export const DrawerHeaderSection = memo(DrawerHeaderSectionInner);
