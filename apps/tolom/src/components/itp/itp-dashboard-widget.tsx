"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpiringItpRecords, useItpStats } from "@/lib/queries/use-itp";

const EXPIRING_THRESHOLD_DAYS = 30;

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
export function ItpDashboardWidget({
  orgId,
  branchId,
  onViewAll,
}: ItpDashboardWidgetProps) {
  const t = (
    useTranslations as unknown as (ns: string) => (key: string) => string
  )("itp");
  const router = useRouter();

  const { data: stats, isPending: statsPending } = useItpStats(orgId, branchId);
  const { data: expiringRecords, isPending: expiringPending } =
    useExpiringItpRecords(orgId, branchId);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push(`/organizations/${orgId}/itp`);
    }
  };

  const loading = statsPending || expiringPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {t("dashboardWidgetTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-xs text-muted-foreground">{t("valid")}</span>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">
                {stats?.valid ?? 0}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-xs text-muted-foreground">
              {t("expiringSoon")}
            </span>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">
                {stats?.expiring_soon ?? 0}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-xs text-muted-foreground">
              {t("expired")}
            </span>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">
                {stats?.expired ?? 0}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-xs text-muted-foreground">
              {t("unknown")}
            </span>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">
                {stats?.unknown ?? 0}
              </span>
            )}
          </div>
        </div>

        {/* Expiring vehicles list */}
        {expiringRecords && expiringRecords.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("expiringVehicles")}
            </p>
            <div className="max-h-44 space-y-1 overflow-y-auto">
              {expiringRecords.slice(0, 5).map((vehicle) => {
                const remainingPct =
                  vehicle.days_until_expiry != null
                    ? Math.max(
                        0,
                        Math.round(
                          (vehicle.days_until_expiry /
                            EXPIRING_THRESHOLD_DAYS) *
                            100,
                        ),
                      )
                    : 0;
                return (
                  <div
                    key={vehicle.vehicle_id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-sm font-medium">
                        {vehicle.plate_number}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {vehicle.days_until_expiry != null
                          ? `${vehicle.days_until_expiry}d`
                          : "—"}
                      </span>
                    </div>
                    <div className="w-16 shrink-0">
                      <Progress value={remainingPct} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
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
