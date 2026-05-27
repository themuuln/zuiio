"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageErrorState, PageShellSkeleton } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { formatMNT } from "@/lib/utils";

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Completed: "default",
  "In Progress": "secondary",
  Diagnosing: "secondary",
  New: "outline",
  "Ready for Pickup": "secondary",
  Cancelled: "destructive",
};

export default function PortalWorkOrdersPage() {
  const t = useTranslations();
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const {
    data: workOrders,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portal", "work-orders", "list"],
    queryFn: async () => {
      const res = await fetch("/api/portal/work-orders", { headers });
      if (!res.ok) throw new Error(t("portal.failedToLoadWorkOrders"));
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
        title={t("portal.failedToLoad")}
        description={error.message}
        onRetry={refetch}
      />
    );
  }

  if (!workOrders || workOrders.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">
          {t("portal.workOrders") ?? "Work Orders"}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList className="size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("portal.noWorkOrders") ?? "No work orders yet"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {t("portal.workOrders") ?? "Work Orders"}
      </h1>

      <div className="flex flex-col gap-3">
        {workOrders.map((wo: Record<string, unknown>) => {
          const vehicle = wo.vehicle as Record<string, unknown> | null;
          return (
            <Link key={wo.id as string} href={`/portal/work-orders/${wo.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {vehicle
                          ? `${vehicle.plate_number ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`
                          : "—"}
                      </span>
                      <Badge
                        variant={
                          STATUS_VARIANTS[wo.status as string] ?? "outline"
                        }
                        className="shrink-0 text-[10px]"
                      >
                        {wo.status as string}
                      </Badge>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {wo.description
                        ? (wo.description as string)
                        : (t("portal.noDescription") ?? "No description")}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>
                        {wo.total != null ? formatMNT(Number(wo.total)) : "—"}
                      </span>
                      {wo.created_at ? (
                        <span>
                          {new Date(
                            wo.created_at as string,
                          ).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
