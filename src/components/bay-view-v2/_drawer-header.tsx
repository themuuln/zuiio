"use client";

import { Car, Loader2, User, Wrench, X } from "lucide-react";
import { MechanicSelect } from "@/components/mechanic-select";
import { Button } from "@/components/ui/button";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { WorkOrderDetail } from "@/lib/types";
import { MongolianLicensePlate } from "./bay-card";
import { StatusPill } from "./status-pill";

interface DrawerHeaderProps {
  wo: WorkOrderDetail | null;
  loading: boolean;
  mechanics: Array<{ id: string; full_name: string }>;
  saving: boolean;
  onAssignMechanic: (mechanicId: string) => Promise<void>;
  onClose: () => void;
  t: (key: string) => string;
}

export function DrawerHeaderSection({
  wo,
  loading,
  mechanics,
  saving,
  onAssignMechanic,
  onClose,
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
              <Car className="size-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
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
              <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                Opened {new Date(wo.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Customer Info */}
        <div className="min-w-0 md:justify-self-center">
          {wo?.customer ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-xs text-foreground/80 font-bold">
                <User className="size-3.5 text-muted-foreground/75" />
                <span>
                  {wo.customer.first_name} {wo.customer.last_name ?? ""}
                </span>
              </div>
              {wo.customer.phone && (
                <span className="text-[11px] text-muted-foreground font-semibold pl-5 font-mono">
                  {wo.customer.phone}
                </span>
              )}
            </div>
          ) : wo ? (
            <span className="text-xs text-muted-foreground italic pl-1">
              No customer data
            </span>
          ) : null}
        </div>

        {/* Column 3: Status & Mechanic Assignment */}
        <div className="flex items-center md:justify-end gap-3 flex-wrap">
          {wo && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wrench className="size-3.5 shrink-0" />
              <MechanicSelect
                value={wo.mechanic_id ?? ""}
                onChange={onAssignMechanic}
                mechanics={effectiveMechanics}
                disabled={saving}
                size="sm"
              />
            </div>
          )}
          {wo?.status && <StatusPill status={wo.status} />}
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
    </DrawerHeader>
  );
}
