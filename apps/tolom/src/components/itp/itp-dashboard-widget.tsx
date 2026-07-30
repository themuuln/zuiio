"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpiringItpRecords, useItpStats } from "@/lib/queries/use-itp";

export interface ItpDashboardWidgetProps {
  /** Organization ID (required — useCurrentOrg from parent) */
  orgId: string;
  /** Optional branch filter */
  branchId?: string | null;
  /** Optional custom "view all" handler */
  onViewAll?: () => void;
}

/**
 * ITP Dashboard Widget — shows ITP summary stats and expiring vehicles.
 * Uses useItpStats for counts and useExpiringItpRecords for the expiring list.
 *
 * orgId is required and must be resolved by the parent via useCurrentOrg().
 */
export function ItpDashboardWidget({ orgId, branchId, onViewAll }: ItpDashboardWidgetProps) {
  const t = (useTranslations as unknown as (ns: string) => (key: string) => string)("itp");
  const router = useRouter();

  const { data: stats, isPending: statsPending } = useItpStats(orgId, branchId);
  const { data: expiringRecords, isPending: expiringPending } = useExpiringItpRecords(orgId, branchId);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push(`/organizations/${orgId}/itp`);
    }
  };

  if (statsPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("dashboardWidgetTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("dashboardWidgetTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {stats?.valid ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">{t("valid")}</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {stats?.expiring_soon ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">{t("expiringSoon")}</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-red-50 p-2 dark:bg-red-950/30">
            <span className="text-lg font-bold text-red-700 dark:text-red-400">
              {stats?.expired ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">{t("expired")}</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-muted p-2">
            <span className="text-lg font-bold text-muted-foreground">
              {stats?.unknown ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">{t("unknown")}</span>
          </div>
        </div>

        {/* Expiring vehicles list */}
        {expiringRecords && expiringRecords.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("expiringVehicles")}
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {expiringRecords.slice(0, 5).map((vehicle) => (
                <div
                  key={vehicle.vehicle_id}
                  className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-muted/50"
                >
                  <span className="truncate font-medium">
                    {vehicle.plate_number}
                  </span>
                  <span className="ml-2 shrink-0 text-amber-600 dark:text-amber-400">
                    {vehicle.days_until_expiry != null
                      ? `${vehicle.days_until_expiry}d`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expiringRecords?.length === 0 && !expiringPending && (
          <p className="text-center text-xs text-muted-foreground">
            {t("noExpiringVehicles")}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <button
          type="button"
          onClick={handleViewAll}
          className="w-full rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80"
        >
          {t("viewAllItpRecords")}
        </button>
      </CardFooter>
    </Card>
  );
}
