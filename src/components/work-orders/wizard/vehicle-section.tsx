"use client";

import { Car, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWizardContext } from "./wizard-context";
import { QuickCreateVehicleSheet } from "./quick-create-vehicle-sheet";

export function VehicleSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  if (ctx.isRestoringFromDraft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="size-4" />
            {t("vehicle")}
            <span className="text-destructive">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Skeleton className="size-5 rounded-none" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="size-4" />
          {t("vehicle")}
          <span className="text-destructive">*</span>
          {ctx.selectedVehicle && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {ctx.selectedVehicle.plate_number}
              {ctx.selectedVehicle.make &&
                ` · ${ctx.selectedVehicle.make} ${ctx.selectedVehicle.model ?? ""}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ctx.selectedVehicle ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4">
            <div className="flex items-center gap-3">
              <Car className="size-5 text-green-600" />
              <div>
                <span className="font-mono font-semibold">
                  {ctx.selectedVehicle.plate_number}
                </span>
                <span className="ml-3 text-sm text-muted-foreground">
                  {[
                    ctx.selectedVehicle.year,
                    ctx.selectedVehicle.make,
                    ctx.selectedVehicle.model,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </div>
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => ctx.setSelectedVehicle(null)}
              >
                <Car className="size-4" />
                {t("change")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <SearchInput
              placeholder={t("searchByPlate")}
              loading={ctx.vehicleSearching}
              onSearch={ctx.setVehicleSearch}
              debounceMs={400}
            />
            {ctx.vehicleSearch && ctx.vehicles.length > 0 && (
              <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
                {ctx.vehicles.map((v) => (
                  <Button
                    variant="ghost"
                    key={v.id}
                    onClick={() => ctx.handleSelectVehicle(v)}
                    className="w-full justify-start gap-3 p-3 min-h-[52px] h-auto"
                  >
                    <Car className="size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="font-mono font-semibold">
                        {v.plate_number}
                      </span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => ctx.setShowQuickVehicle(true)}
              className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
            >
              <Plus className="size-4" />
              {t("quickCreateVehicle")}
            </Button>
            <QuickCreateVehicleSheet
              open={ctx.showQuickVehicle}
              onOpenChange={ctx.setShowQuickVehicle}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
