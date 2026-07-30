"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageErrorState, PageShellSkeleton } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";

const STATUS_CONFIG: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  sent: {
    variant: "secondary",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-transparent",
  },
  partially_approved: {
    variant: "outline",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  approved: { variant: "default", className: "" },
  converted: {
    variant: "secondary",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  },
  declined: { variant: "destructive", className: "" },
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Sent",
  partially_approved: "Partially Approved",
  approved: "Approved",
  converted: "Converted",
  declined: "Declined",
};

interface PortalInspection {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  odometer: number | null;
  vehicle: {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
  } | null;
  item_count: number;
}

export default function PortalInspectionsPage() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const {
    data: inspections,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portal", "inspections", "list"],
    queryFn: async () => {
      const res = await fetch("/api/portal/inspections", { headers });
      if (!res.ok) throw new Error(t("portal.failedToLoadInspections"));
      const json = await res.json();
      return (json.data ?? []) as PortalInspection[];
    },
    enabled: !!customer,
  });

  if (authLoading || isPending) {
    return <PageShellSkeleton cards={3} title={t("portal.inspections")} />;
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

  if (!inspections || inspections.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Typography.H1 className="text-xl font-semibold">
          {t("portal.inspections")}
        </Typography.H1>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList className="size-10 text-muted-foreground/50" />
            <Typography.Muted className="text-sm text-muted-foreground">
              {t("portal.noInspections")}
            </Typography.Muted>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Typography.H1 className="text-xl font-semibold">
        {t("portal.inspections")}
      </Typography.H1>

      <div className="flex flex-col gap-3">
        {inspections.map((inspection: PortalInspection) => {
          const config = STATUS_CONFIG[inspection.status] ?? STATUS_CONFIG.sent;
          const label = STATUS_LABELS[inspection.status] ?? inspection.status;
          const vehicle = inspection.vehicle;

          return (
            <Link
              key={inspection.id}
              href={`/portal/inspections/${inspection.id}`}
            >
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
                        variant={config.variant}
                        className={config.className}
                      >
                        {label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>
                        {new Date(inspection.created_at).toLocaleDateString()}
                      </span>
                      {inspection.odometer != null && (
                        <span>{inspection.odometer.toLocaleString()} km</span>
                      )}
                      <span>
                        {inspection.item_count}{" "}
                        {inspection.item_count === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
