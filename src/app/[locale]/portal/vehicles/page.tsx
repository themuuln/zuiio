"use client";

import { ArrowRight, Car, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortalAuth } from "@/hooks/use-portal-auth";

export default function PortalVehiclesPage() {
  const t = useTranslations();
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["portal", "vehicles", "list"],
    queryFn: async () => {
      const res = await fetch("/api/portal/vehicles", { headers });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!customer,
  });

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <div className="space-y-3">
          {vehicles.map((v: Record<string, unknown>) => (
            <Link
              key={v.id as string}
              href={`/portal/vehicles/${v.id}`}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Car className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">
                    {v.plate_number as string}
                  </p>
                  <p className="text-sm text-muted-foreground">
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
