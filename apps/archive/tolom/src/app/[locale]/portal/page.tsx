"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  Car,
  ClipboardList,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageErrorState, PageShellSkeleton } from "@/components/page-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { cn } from "@/lib/utils";

export default function PortalDashboardPage() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const {
    data: vehicles,
    isLoading: vehiclesLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portal", "vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/portal/vehicles", { headers });
      if (!res.ok) throw new Error(t("portal.failedToLoadVehicles"));
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!customer,
  });

  const { data: inspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ["portal", "inspections"],
    queryFn: async () => {
      const res = await fetch("/api/portal/inspections", { headers });
      if (!res.ok) throw new Error(t("portal.failedToLoadInspections"));
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!customer,
  });

  const isLoad = authLoading || vehiclesLoading;

  if (isLoad) {
    return (
      <PageShellSkeleton
        cards={3}
        title={t("portal.welcome", { name: customer?.first_name ?? "" })}
        description={t("portal.dashboardDesc")}
      />
    );
  }

  if (error) {
    return (
      <PageErrorState
        description={error.message}
        onRetry={() => refetch()}
        className="min-h-[260px]"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("portal.welcome", { name: customer?.first_name ?? "" })}
        </Typography.H1>
        <Typography.Muted className="text-sm text-muted-foreground mt-1">
          {t("portal.dashboardDesc")}
        </Typography.Muted>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("portal.myVehicles")}
            </CardTitle>
            <Car className="size-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-2xl font-semibold">
              {vehicles?.length ?? 0}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("portal.totalVisits")}
            </CardTitle>
            <Wrench className="size-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-2xl font-semibold">
              {customer?.total_visits ?? 0}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("portal.lastVisit")}
            </CardTitle>
            <CalendarClock className="size-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-sm font-medium">
              {customer?.last_visit_at
                ? new Date(customer.last_visit_at).toLocaleDateString()
                : "—"}
            </Typography.Text>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles quick list */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">
            {t("portal.myVehicles")}
          </CardTitle>
          <Link
            href="/portal/vehicles"
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            {t("common.viewAll")} <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {!vehicles || vehicles.length === 0 ? (
            <Typography.Muted className="text-sm text-muted-foreground py-4 text-center">
              {t("portal.noVehicles")}
            </Typography.Muted>
          ) : (
            <div className="flex flex-col gap-2">
              {vehicles
                .slice(0, 5)
                .map(
                  (v: {
                    id: string;
                    plate_number: string;
                    make: string;
                    model: string;
                    year: number | null;
                  }) => (
                    <Link
                      key={v.id as string}
                      href={`/portal/vehicles/${v.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3.5 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Car className="size-4 text-muted-foreground/60" />
                        <div className="min-w-0">
                          <Typography.Text className="truncate text-sm font-medium">
                            {v.plate_number as string}
                          </Typography.Text>
                          <Typography.Muted className="truncate text-xs text-muted-foreground/70">
                            {v.make as string} {v.model as string}
                            {v.year ? ` · ${v.year}` : ""}
                          </Typography.Muted>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground/40" />
                    </Link>
                  ),
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspections */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">
            {t("portal.inspections")}
          </CardTitle>
          <Link
            href="/portal/inspections"
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            {t("common.viewAll")} <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {inspectionsLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-14 animate-pulse rounded-lg bg-muted" />
              <div className="h-14 animate-pulse rounded-lg bg-muted" />
              <div className="h-14 animate-pulse rounded-lg bg-muted" />
            </div>
          ) : !inspections || inspections.length === 0 ? (
            <Typography.Muted className="text-sm text-muted-foreground py-4 text-center">
              {t("portal.noInspections")}
            </Typography.Muted>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Pending count banner */}
              {(() => {
                const pendingCount = inspections.filter(
                  (i: { status: string }) =>
                    i.status === "sent" || i.status === "partially_approved",
                ).length;
                if (pendingCount > 0) {
                  return (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-800/30 dark:bg-amber-950/30 dark:text-amber-300">
                      <ClipboardList className="size-4 shrink-0" />
                      <span>
                        {pendingCount}{" "}
                        {t("portal.pendingApproval").toLowerCase()}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Recent inspections */}
              {inspections.slice(0, 3).map(
                (inv: {
                  id: string;
                  status: string;
                  created_at: string;
                  vehicle: {
                    plate_number: string;
                    make: string;
                    model: string;
                  };
                }) => (
                  <Link
                    key={inv.id as string}
                    href={`/portal/inspections?id=${inv.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3.5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ClipboardList className="size-4 text-muted-foreground/60" />
                      <div className="min-w-0">
                        <Typography.Text className="truncate text-sm font-medium">
                          {inv.vehicle &&
                          typeof inv.vehicle === "object" &&
                          "plate_number" in inv.vehicle
                            ? String(inv.vehicle.plate_number)
                            : t("common.unknown")}
                        </Typography.Text>
                        <Typography.Muted className="truncate text-xs text-muted-foreground/70">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </Typography.Muted>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        inv.status === "sent" ||
                          inv.status === "partially_approved"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : inv.status === "approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : inv.status === "declined"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {inv.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
