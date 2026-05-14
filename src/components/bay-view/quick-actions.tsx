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
      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <div className="flex items-center justify-center size-7 rounded-lg bg-emerald-500/10">
              <Zap className="size-3.5 text-emerald-500" />
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
          <div className="px-3 pb-3 space-y-1.5">
            <button
              type="button"
              onClick={() => setShowVehicleReg(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-medium hover:bg-muted/40 hover:border-primary/30 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10 shrink-0">
                <Car className="size-4 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">{t("registerVehicle")}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("registerVehicleDesc")}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowMechanicReg(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-medium hover:bg-muted/40 hover:border-primary/30 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-purple-500/10 shrink-0">
                <Wrench className="size-4 text-purple-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">{t("registerMechanic")}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("registerMechanicDesc")}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowServiceLookup(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-medium hover:bg-muted/40 hover:border-primary/30 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10 shrink-0">
                <History className="size-4 text-amber-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">{t("serviceHistory")}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("serviceHistoryDesc")}
                </div>
              </div>
            </button>

            <div className="border-t border-border/50 my-1.5" />

            <button
              type="button"
              onClick={() => setShowShiftReport(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-medium hover:bg-muted/40 hover:border-primary/30 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 shrink-0">
                <LayoutDashboard className="size-4 text-emerald-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">{t("shiftReport")}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("shiftReportDesc")}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowPinSettings(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-medium hover:bg-muted/40 hover:border-primary/30 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-rose-500/10 shrink-0">
                <KeyRound className="size-4 text-rose-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">{t("bayPinSettings")}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("bayPinSettingsDesc")}
                </div>
              </div>
            </button>
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
