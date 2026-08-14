"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VehicleFormT } from "./_types";

type ModeTabsProps = {
  currentMode: "quick" | "full";
  onModeChange: (mode: "quick" | "full") => void;
  t: VehicleFormT;
};

export function ModeTabs({ currentMode, onModeChange, t }: ModeTabsProps) {
  return (
    <Tabs
      value={currentMode}
      onValueChange={(val) => onModeChange(val as "quick" | "full")}
      className="w-full shrink-0 animate-fade-in"
    >
      <TabsList className="flex w-full h-9 p-0.5 rounded-lg bg-muted border border-border">
        <TabsTrigger
          value="quick"
          className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
        >
          {t("quickCreateVehicle", { fallback: "Quick Vehicle" })}
        </TabsTrigger>
        <TabsTrigger
          value="full"
          className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
        >
          {t("addVehicle", { fallback: "Full Details" })}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
