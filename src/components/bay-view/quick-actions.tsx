"use client";

import {
  Car,
  ChevronDown,
  ChevronUp,
  History,
  Wrench,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { MechanicRegistrationDialog } from "./mechanic-registration-dialog";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";

export function QuickActions() {
  const [collapsed, setCollapsed] = useState(false);
  const [showVehicleReg, setShowVehicleReg] = useState(false);
  const [showMechanicReg, setShowMechanicReg] = useState(false);
  const [showServiceLookup, setShowServiceLookup] = useState(false);

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
            <span>Quick Actions</span>
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
                <div className="font-medium">Register Vehicle</div>
                <div className="text-[11px] text-muted-foreground">
                  Add new car or look up existing
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
                <div className="font-medium">Register Mechanic</div>
                <div className="text-[11px] text-muted-foreground">
                  Add new mechanic to roster
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
                <div className="font-medium">Service History</div>
                <div className="text-[11px] text-muted-foreground">
                  View car service records
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {showVehicleReg && (
        <VehicleRegistrationDialog
          onClose={() => setShowVehicleReg(false)}
        />
      )}

      {showMechanicReg && (
        <MechanicRegistrationDialog
          onClose={() => setShowMechanicReg(false)}
        />
      )}

      {showServiceLookup && (
        <VehicleRegistrationDialog
          onClose={() => setShowServiceLookup(false)}
          initialMode="lookup"
        />
      )}
    </>
  );
}
