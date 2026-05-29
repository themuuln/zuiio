"use client";

import { Car, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { Typography } from "@/components/ui/typography";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import { useWizardContext } from "./wizard-context";

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
          <Item
            variant="outline"
            className="border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4"
          >
            <ItemMedia
              variant="icon"
              className="[&_svg]:size-5 [&_svg]:text-green-600"
            >
              <Car />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                <span className="font-mono font-semibold">
                  {ctx.selectedVehicle.plate_number}
                </span>
                <span className="ml-3 text-sm font-normal text-muted-foreground">
                  {[
                    ctx.selectedVehicle.year,
                    ctx.selectedVehicle.make,
                    ctx.selectedVehicle.model,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => ctx.setSelectedVehicle(null)}
              >
                <Car className="size-4" />
                {t("change")}
              </Button>
            </ItemActions>
          </Item>
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
            {!ctx.showQuickVehicle ? (
              <Button
                variant="outline"
                onClick={() => ctx.setShowQuickVehicle(true)}
                className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
              >
                <Plus className="size-4" />
                {t("quickCreateVehicle")}
              </Button>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/20 mt-2">
                <Typography.Text className="text-sm font-semibold mb-3 block">
                  {t("newVehicle")}
                </Typography.Text>
                <VehicleForm
                  mode="quick"
                  customerId={ctx.selectedCustomer?.id}
                  showOwnerSelect={false}
                  onSuccess={(vehicle) => {
                    ctx.handleSelectVehicle(vehicle);
                    ctx.setShowQuickVehicle(false);
                  }}
                  onCancel={() => ctx.setShowQuickVehicle(false)}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
