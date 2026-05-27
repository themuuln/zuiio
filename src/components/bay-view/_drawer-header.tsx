"use client";

import { Car, Loader2, User, Wrench, X } from "lucide-react";
import { MechanicSelect } from "@/components/mechanic-select";
import { Button } from "@/components/ui/button";
import {
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { WorkOrderDetail } from "@/lib/types";
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
  return (
    <DrawerHeader className="border-b border-border px-4 py-3 text-left shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            {loading ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <Car className="size-5 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <DrawerTitle className="text-base">
              {wo ? (
                <span className="truncate block">
                  {wo.vehicle?.plate_number ?? t("workOrder")}
                </span>
              ) : (
                t("workOrder")
              )}
            </DrawerTitle>
            {wo && (
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span className="font-mono">WO#{wo.id.slice(0, 8)}</span>
                {wo.created_at && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span>
                      {new Date(wo.created_at).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {wo && (
          <div className="flex min-w-[260px] flex-1 flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/60">
                {wo.vehicle?.make}
              </span>
              <span className="font-medium">{wo.vehicle?.model}</span>
              {wo.vehicle?.year && (
                <span className="text-muted-foreground/50 text-xs">
                  · {wo.vehicle.year}
                </span>
              )}
            </div>
            {wo.customer && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="size-3" />
                <span>
                  {wo.customer.first_name} {wo.customer.last_name ?? ""}
                </span>
                {wo.customer.phone && (
                  <span className="text-muted-foreground/50 text-xs">
                    {wo.customer.phone}
                  </span>
                )}
              </div>
            )}
            <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
              <Wrench className="size-3 shrink-0" />
              <MechanicSelect
                value={wo.mechanic_id ?? ""}
                onChange={onAssignMechanic}
                mechanics={mechanics}
                disabled={saving}
                size="sm"
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
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
