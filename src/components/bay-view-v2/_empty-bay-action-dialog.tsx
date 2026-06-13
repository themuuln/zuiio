"use client";

import { Car, Clock, Loader2, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { cn, formatPlateNumber } from "@/lib/utils";

interface EmptyBayActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bayNumber: number;
  queue: (WorkOrder & { vehicle: Vehicle | null })[];
  onSelectRegister: () => void;
  onSelectQueueItem: (workOrderId: string) => void;
  onSelectRegisterAndAssign: () => void;
}

// ── Utility: time since creation ──────────────────────────────
function timeSince(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "<1m";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function EmptyBayActionDialog({
  open,
  onOpenChange,
  bayNumber,
  queue,
  onSelectRegister,
  onSelectQueueItem,
  onSelectRegisterAndAssign,
}: EmptyBayActionDialogProps) {
  const t = useTranslations("bayView");
  const [selectedQueueItem, setSelectedQueueItem] = useState<string | null>(
    null,
  );

  const handleRegister = () => {
    onOpenChange(false);
    onSelectRegister();
  };

  const handleRegisterAndAssign = () => {
    onOpenChange(false);
    onSelectRegisterAndAssign();
  };

  const handleQueueSelect = (woId: string) => {
    setSelectedQueueItem(woId);
    onOpenChange(false);
    onSelectQueueItem(woId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-0 p-0">
        {/* ── Header ────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs font-mono">
              Bay #{bayNumber}
            </Badge>
          </div>
          <DialogTitle className="text-lg">{t("addVehicleTitle")}</DialogTitle>
          <DialogDescription className="text-sm mt-1">
            {t("addVehicleSubtitle", { bayNumber })}
          </DialogDescription>
        </div>

        {/* ── Action cards ──────────────────────────────────── */}
        <div className="px-6 pb-4 flex flex-col gap-2.5">
          {/* ── Primary: Register & Assign ─────────────────── */}
          <button
            type="button"
            onClick={handleRegisterAndAssign}
            className={cn(
              "group relative flex items-center gap-3.5 rounded-xl border-2 p-3.5 text-left",
              "border-emerald-500/40 bg-gradient-to-br from-emerald-500/8 to-emerald-500/3",
              "transition-all duration-200",
              "hover:border-emerald-500/70 hover:shadow-md hover:shadow-emerald-500/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
            )}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:shadow-emerald-500/30">
              <Zap className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex-1 min-w-0">
                  {t("registerAndAssignToBay", { bayNumber })}
                </span>
                <span className="text-[10px] font-normal text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                  {t("selectLabel")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t("registerAndAssignDesc")}
              </div>
            </div>
          </button>

          {/* ── Secondary: Register & Queue ───────────────── */}
          <button
            type="button"
            onClick={handleRegister}
            className="group flex items-center gap-3.5 rounded-lg border border-border/50 bg-muted/20 p-3 text-left transition-all duration-200 hover:border-border hover:bg-muted/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
              <Car className="size-[18px]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex-1 min-w-0">
                  {t("registerNewVehicle")}
                </span>
                <span className="text-[10px] font-normal text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                  {t("selectLabel")}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t("registerNewVehicleDesc")}
              </div>
            </div>
          </button>
        </div>

        {/* ── Queue section ─────────────────────────────────── */}
        {queue.length > 0 && (
          <>
            <Separator />
            <div className="px-6 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3.5" />
                  {t("pickFromQueue")}
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono h-4 px-1.5"
                >
                  {queue.length}
                </Badge>
              </div>
              <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto -mx-2">
                {queue.slice(0, 10).map((wo) => {
                  const isBusy = selectedQueueItem === wo.id;
                  return (
                    <button
                      key={wo.id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleQueueSelect(wo.id)}
                      className={cn(
                        "group/row flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left",
                        "transition-all duration-150",
                        isBusy
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-accent/50 active:bg-accent cursor-pointer",
                      )}
                    >
                      {isBusy ? (
                        <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                      ) : (
                        <div className="size-4 shrink-0 rounded border border-border flex items-center justify-center group-hover/row:border-primary/50 group-hover/row:bg-primary/5">
                          <Car className="size-2.5 text-muted-foreground group-hover/row:text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex items-baseline gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {formatPlateNumber(wo.vehicle?.plate_number ?? "")}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {wo.vehicle?.make} {wo.vehicle?.model}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                        {wo.created_at ? timeSince(wo.created_at) : ""}
                      </span>
                    </button>
                  );
                })}
                {queue.length > 10 && (
                  <div className="text-center text-[10px] text-muted-foreground/60 py-2">
                    {t("moreInQueue", { count: queue.length - 10 })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
