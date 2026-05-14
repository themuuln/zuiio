"use client";

import type { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { StatusPill } from "./status-pill";

interface BayWorkOrder {
  id: string;
  vehicle?: {
    plate_number: string;
    make: string;
    model: string;
    year?: number | null;
  } | null;
  customer_name?: string | null;
  mechanic?: { full_name?: string | null; id?: string } | null;
  status: string;
  started_at?: string | null;
  created_at?: string;
}

interface Bay {
  bayNumber: number;
  workOrder: BayWorkOrder | null;
}

interface BayListViewProps {
  bays: Bay[];
  onStatusClick: (woId: string, status: string) => void;
  onOpenDetail: (woId: string) => void;
  t: ReturnType<typeof useTranslations<"bayView">>;
}

export function BayListView({
  bays,
  onStatusClick,
  onOpenDetail,
  t,
}: BayListViewProps) {
  return (
    <div className="max-h-[calc(100vh-22rem)] overflow-y-auto space-y-1">
      <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider border-b border-border/50">
        <span className="w-12 shrink-0">{t("listHeaderBay")}</span>
        <span className="flex-1 min-w-0">{t("listHeaderVehicle")}</span>
        <span className="w-24 shrink-0 hidden sm:block">
          {t("listHeaderCustomer")}
        </span>
        <span className="w-28 shrink-0 hidden md:block">
          {t("listHeaderMechanic")}
        </span>
        <span className="w-28 shrink-0">{t("listHeaderStatus")}</span>
        <span className="w-16 shrink-0 text-right hidden sm:block">
          {t("listHeaderTime")}
        </span>
        <span className="w-28 shrink-0" />
      </div>
      {bays.map((bay) => {
        const wo = bay.workOrder;
        return (
          <div
            key={bay.bayNumber}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
              wo
                ? "bg-card hover:bg-muted/40 border border-border/50"
                : "bg-muted/10 border border-dashed border-border/30",
            )}
          >
            <span className="w-12 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
              #{bay.bayNumber}
            </span>
            <div className="flex-1 min-w-0">
              {wo?.vehicle ? (
                <div className="truncate">
                  <span className="text-sm font-semibold">
                    {wo.vehicle.plate_number}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5 hidden sm:inline">
                    {wo.vehicle.make} {wo.vehicle.model}
                    {wo.vehicle.year ? ` · ${wo.vehicle.year}` : ""}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/50 italic">
                  {t("emptyBay")}
                </span>
              )}
            </div>
            <span className="w-24 shrink-0 text-xs text-muted-foreground truncate hidden sm:block">
              {wo?.customer_name ?? "—"}
            </span>
            <span className="w-28 shrink-0 text-xs text-muted-foreground truncate hidden md:block">
              {wo?.mechanic?.full_name ?? "—"}
            </span>
            <span className="w-28 shrink-0">
              {wo ? <StatusPill status={wo.status} /> : null}
            </span>
            <span className="w-16 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums hidden sm:block">
              {(wo?.started_at ?? wo?.created_at)
                ? (() => {
                    const timestamp = wo?.started_at ?? wo?.created_at;
                    if (!timestamp) return "—";
                    const d = new Date(timestamp);
                    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
                    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
                  })()
                : "—"}
            </span>
            <div className="w-28 shrink-0 flex gap-1 justify-end">
              {wo &&
                wo.status !== "Ready for Pickup" &&
                wo.status !== "Completed" &&
                wo.status !== "Cancelled" && (
                  <button
                    type="button"
                    onClick={() => onStatusClick(wo.id, "Ready for Pickup")}
                    className="rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-medium text-green-600 hover:bg-green-500/20 transition-colors"
                  >
                    {t("markReady")}
                  </button>
                )}
              {wo && (
                <button
                  type="button"
                  onClick={() => onOpenDetail(wo.id)}
                  className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {t("open")}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
