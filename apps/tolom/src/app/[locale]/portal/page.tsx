"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Car, Wrench } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageErrorState, PageShellSkeleton } from "@/components/page-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";

export default function PortalDashboardPage() {
  const t = useTranslations();
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
    </div>
  );
}
