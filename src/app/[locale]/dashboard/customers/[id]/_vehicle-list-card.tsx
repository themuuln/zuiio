"use client";

import { ArrowLeft, Car } from "lucide-react";
import type { useTranslations } from "next-intl";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExportColumn } from "@/lib/export";
import type { useRouter } from "@/lib/i18n/navigation";
import { Typography } from "@/components/ui/typography";

export interface CustomerVehicleSummary {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
}

interface VehicleListCardProps {
  vehicles: CustomerVehicleSummary[];
  customerId: string;
  router: ReturnType<typeof useRouter>;
  vehicleExportColumns: ExportColumn<CustomerVehicleSummary>[];
  t: ReturnType<typeof useTranslations<"customers">>;
}

export function VehicleListCard({
  vehicles,
  customerId,
  router,
  vehicleExportColumns,
  t,
}: VehicleListCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {t("vehicles")} ({vehicles.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <ExportButton
              data={vehicles}
              columns={vehicleExportColumns}
              filename={`customer-${customerId.slice(0, 8)}-vehicles.xlsx`}
              sheetName="Vehicles"
              label="Export"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/dashboard/vehicles/new?customerId=${customerId}`)
              }
            >
              <Car className="size-4" />
              {t("addVehicle")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <Typography.Muted className="py-6 text-center text-sm text-muted-foreground">
            {t("noVehicles")}
          </Typography.Muted>
        ) : (
          <div className="flex flex-col gap-2">
            {vehicles.map((vehicle) => (
              <Button
                key={vehicle.id}
                onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                variant="ghost"
                className="w-full justify-start gap-3 rounded-lg bg-muted/50 p-3"
              >
                <Car className="size-5 shrink-0 text-muted-foreground" />
                <div className="flex-1 text-left">
                  <Typography.Text className="font-medium">{vehicle.plate_number}</Typography.Text>
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {[vehicle.year, vehicle.make, vehicle.model]
                      .filter(Boolean)
                      .join(" ")}
                  </Typography.Muted>
                </div>
                <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
