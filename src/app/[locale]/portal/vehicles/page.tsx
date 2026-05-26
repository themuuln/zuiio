"use client";

import { ArrowRight, Car } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PageErrorState, PageShellSkeleton } from "@/components/page-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortalAuth } from "@/hooks/use-portal-auth";

export default function PortalVehiclesPage() {
  const t = useTranslations();
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const { data: vehicles, isLoading, error, refetch } = useQuery({
    queryKey: ["portal", "vehicles", "list"],
    queryFn: async () => {
      const res = await fetch("/api/portal/vehicles", { headers });
      if (!res.ok) throw new Error(t("portal.failedToLoadVehicles"));
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!customer,
  });

  if (authLoading || isLoading) {
    return <PageShellSkeleton cards={3} />;
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
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("portal.myVehicles")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("portal.vehiclesDesc")}
        </p>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("portal.noVehicles")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {vehicles.map((v: Record<string, unknown>) => (
            <Link
              key={v.id as string}
              href={`/portal/vehicles/${v.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Car className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {v.plate_number as string}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {v.make as string} {v.model as string}
                    {v.year ? ` (${v.year})` : ""}
                  </p>
                  {(v as { color?: string }).color && (
                    <p className="text-xs text-muted-foreground/60">
                      {v.color as string}
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground/40" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
