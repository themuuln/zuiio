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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
        <Button
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-between px-4 py-3 h-auto"
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
        </Button>

        {!collapsed && (
          <div className="flex flex-col gap-3 px-3 pb-3">
            {/* Registration actions */}
            <div className="flex flex-col gap-1.5 rounded-xl bg-muted/15 p-1.5 ring-1 ring-border/40">
              <Button
                variant="outline"
                onClick={() => setShowVehicleReg(true)}
                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium"
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
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowMechanicReg(true)}
                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium"
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
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowServiceLookup(true)}
                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium"
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
              </Button>
            </div>

            {/* Admin actions */}
            <Separator className="mx-2 shadow-sm" />

            <div className="flex flex-col gap-1.5 rounded-xl bg-muted/15 p-1.5 ring-1 ring-border/40">
              <Button
                variant="outline"
                onClick={() => setShowShiftReport(true)}
                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium"
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
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowPinSettings(true)}
                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium"
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
              </Button>
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
