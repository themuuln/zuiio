"use client";

import { CarFront } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMNT } from "@/lib/utils";

interface VehicleModelInfo {
  id: string;
  make: string;
  model: string;
}

interface VehicleFitmentItem {
  id: string;
  specific_price: number | null;
  compatibility_notes: string | null;
  vehicle_model: VehicleModelInfo | null;
}

interface VehicleFitmentProps {
  fitments: VehicleFitmentItem[];
  isPending: boolean;
}

export function VehicleFitment({ fitments, isPending }: VehicleFitmentProps) {
  const t = useTranslations("inventory");

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <CarFront className="size-4 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">
          {t("vehicleFitment")}
        </CardTitle>
        <Badge variant="secondary" className="ml-auto">
          {fitments.length}
        </Badge>
      </CardHeader>
      <CardContent>
        {fitments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noVehicleFitment")}
          </p>
        ) : (
          <div className="space-y-2">
            {fitments.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium">
                    {f.vehicle_model?.make} {f.vehicle_model?.model}
                  </span>
                  {f.compatibility_notes && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {f.compatibility_notes}
                    </p>
                  )}
                </div>
                {f.specific_price != null && (
                  <span className="text-sm font-medium tabular-nums">
                    {formatMNT(f.specific_price)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
