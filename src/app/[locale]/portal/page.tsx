"use client";

import { Car, CalendarClock, Wrench, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { cn } from "@/lib/utils";

export default function PortalDashboardPage() {
  const t = useTranslations();
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["portal", "vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/portal/vehicles", { headers });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!customer,
  });

  const isLoad = authLoading || vehiclesLoading;

  if (isLoad) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("portal.welcome", { name: customer?.first_name ?? "" })}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("portal.dashboardDesc")}
        </p>
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
            <p className="text-2xl font-semibold">{vehicles?.length ?? 0}</p>
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
            <p className="text-2xl font-semibold">{customer?.total_visits ?? 0}</p>
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
            <p className="text-sm font-medium">
              {customer?.last_visit_at
                ? new Date(customer.last_visit_at).toLocaleDateString()
                : "—"}
            </p>
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
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("portal.noVehicles")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {vehicles.slice(0, 5).map((v: Record<string, unknown>) => (
                <Link
                  key={v.id as string}
                  href={`/portal/vehicles/${v.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3.5 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Car className="size-4 text-muted-foreground/60" />
                    <div>
                      <p className="text-sm font-medium">
                        {v.plate_number as string}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {v.make as string} {v.model as string}
                        {v.year ? ` · ${v.year}` : ""}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground/40" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
