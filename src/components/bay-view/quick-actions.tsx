"use client";

import {
  Car,
  ChevronDown,
  ChevronUp,
  History,
  KeyRound,
  LayoutDashboard,
  Wrench,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MechanicRegistrationDialog } from "./mechanic-registration-dialog";
import { PinSettingsDialog } from "./pin-settings-dialog";
import { ShiftReportModal } from "./shift-report-modal";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";

export function QuickActions() {
  const t = useTranslations("bayView");
  const [collapsed, setCollapsed] = useState(false);
  const [showVehicleReg, setShowVehicleReg] = useState(false);
  const [showMechanicReg, setShowMechanicReg] = useState(false);
  const [showServiceLookup, setShowServiceLookup] = useState(false);
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [showPinSettings, setShowPinSettings] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-sm shadow-black/5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition-all duration-200 hover:bg-muted/40"
        >
          <span className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/15">
              <Zap className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span>{t("quickActions")}</span>
          </span>
          {collapsed ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-3 px-3 pb-3">
            {/* Registration actions */}
            <div className="space-y-1.5 rounded-xl bg-muted/15 p-1.5 ring-1 ring-border/40">
              <button
                type="button"
                onClick={() => setShowVehicleReg(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm font-medium shadow-sm shadow-black/[0.02] transition-all duration-200 hover:scale-[1.015] hover:border-blue-500/25 hover:bg-blue-500/[0.04] active:scale-[0.985]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/15">
                  <Car className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{t("registerVehicle")}</div>
                  <div className="hidden sm:block text-[11px] text-muted-foreground">
                    {t("registerVehicleDesc")}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowMechanicReg(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm font-medium shadow-sm shadow-black/[0.02] transition-all duration-200 hover:scale-[1.015] hover:border-purple-500/25 hover:bg-purple-500/[0.04] active:scale-[0.985]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 ring-1 ring-purple-500/15">
                  <Wrench className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{t("registerMechanic")}</div>
                  <div className="hidden sm:block text-[11px] text-muted-foreground">
                    {t("registerMechanicDesc")}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowServiceLookup(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm font-medium shadow-sm shadow-black/[0.02] transition-all duration-200 hover:scale-[1.015] hover:border-amber-500/25 hover:bg-amber-500/[0.04] active:scale-[0.985]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/15">
                  <History className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{t("serviceHistory")}</div>
                  <div className="hidden sm:block text-[11px] text-muted-foreground">
                    {t("serviceHistoryDesc")}
                  </div>
                </div>
              </button>
            </div>

            {/* Admin actions */}
            <div className="mx-2 border-t border-border/80 shadow-sm" />

            <div className="space-y-1.5 rounded-xl bg-muted/15 p-1.5 ring-1 ring-border/40">
              <button
                type="button"
                onClick={() => setShowShiftReport(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm font-medium shadow-sm shadow-black/[0.02] transition-all duration-200 hover:scale-[1.015] hover:border-emerald-500/25 hover:bg-emerald-500/[0.04] active:scale-[0.985]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/15">
                  <LayoutDashboard className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{t("shiftReport")}</div>
                  <div className="hidden sm:block text-[11px] text-muted-foreground">
                    {t("shiftReportDesc")}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowPinSettings(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm font-medium shadow-sm shadow-black/[0.02] transition-all duration-200 hover:scale-[1.015] hover:border-rose-500/25 hover:bg-rose-500/[0.04] active:scale-[0.985]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 ring-1 ring-rose-500/15">
                  <KeyRound className="size-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{t("bayPinSettings")}</div>
                  <div className="hidden sm:block text-[11px] text-muted-foreground">
                    {t("bayPinSettingsDesc")}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {showVehicleReg && (
        <VehicleRegistrationDialog onClose={() => setShowVehicleReg(false)} />
      )}

      {showMechanicReg && (
        <MechanicRegistrationDialog onClose={() => setShowMechanicReg(false)} />
      )}

      {showServiceLookup && (
        <VehicleRegistrationDialog
          onClose={() => setShowServiceLookup(false)}
          initialMode="lookup"
        />
      )}

      {showShiftReport && (
        <ShiftReportModal onClose={() => setShowShiftReport(false)} />
      )}

      {showPinSettings && (
        <PinSettingsDialog onClose={() => setShowPinSettings(false)} />
      )}
    </>
  );
}
