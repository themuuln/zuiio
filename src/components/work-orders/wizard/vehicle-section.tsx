"use client";

import { Car, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWizardContext } from "./wizard-context";

export function VehicleSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="size-4" />
          {t("vehicle")}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => ctx.setSelectedVehicle(null)}
            >
              {t("change")}
            </Button>
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
            {!ctx.showQuickVehicle && (
              <Button
                variant="outline"
                onClick={() => ctx.setShowQuickVehicle(true)}
                className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
              >
                <Plus className="size-4" />
                {t("quickCreateVehicle")}
              </Button>
            )}
            {ctx.showQuickVehicle && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
                <p className="text-sm font-medium">{t("newVehicle")}</p>
                <Input
                  placeholder={t("plateRequired")}
                  value={ctx.quickPlate}
                  onChange={(e) => ctx.setQuickPlate(e.target.value)}
                  className="h-11"
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder={t("make")}
                    value={ctx.quickMake}
                    onChange={(e) => ctx.setQuickMake(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder={t("model")}
                    value={ctx.quickModel}
                    onChange={(e) => ctx.setQuickModel(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder={t("year")}
                    type="number"
                    value={ctx.quickYear}
                    onChange={(e) => ctx.setQuickYear(e.target.value)}
                    className="h-11"
                  />
                </div>
                {ctx.vehicleCreateError && (
                  <p className="text-sm text-destructive">
                    {ctx.vehicleCreateError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      ctx.setShowQuickVehicle(false);
                      ctx.setQuickPlate("");
                      ctx.setQuickMake("");
                      ctx.setQuickModel("");
                      ctx.setQuickYear("");
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    size="sm"
                    disabled={ctx.creatingVehicle || !ctx.quickPlate.trim()}
                    onClick={ctx.handleQuickCreateVehicle}
                  >
                    {ctx.creatingVehicle
                      ? t("creating")
                      : t("createAndSelectVehicle")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
