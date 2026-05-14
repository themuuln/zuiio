"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";

interface MechanicEodSummary {
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
}

interface WorkOrderRow {
  id: string;
  status: string;
  description: string | null;
  total: number;
  customer_name: string | null;
  vehicle_plate: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Diagnosing:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "In Progress":
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Ready for Pickup":
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatMNT(value: number): string {
  return `₮${new Intl.NumberFormat("mn-MN").format(value)}`;
}

export default function MechanicPage() {
  const t = useTranslations();
  const router = useRouter();
  const { profile, loading: roleLoading, isMechanic } = useCurrentUserRole();
  const [eod, setEod] = useState<MechanicEodSummary | null>(null);
  const [assignedWos, setAssignedWos] = useState<WorkOrderRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organizationId || !profile?.id) return;
    const orgId = profile.organizationId;
    const userId = profile.id;
    const today = new Date().toISOString().split("T")[0];

    setDataLoading(true);
    const eodUrl = `/api/organizations/${orgId}/reports?type=eod&date=${today}&mechanic=${userId}`;
    const woUrl = `/api/organizations/${orgId}/work-orders?mechanic=${userId}&status=In Progress&status=Diagnosing&status=New&status=Ready for Pickup`;

    Promise.all([
      fetch(eodUrl)
        .then((r) => r.json())
        .catch(() => ({ data: null })),
      fetch(woUrl)
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ])
      .then(([eodJson, woJson]) => {
        if (eodJson.data?.mechanics?.length > 0) {
          setEod(eodJson.data.mechanics[0]);
        }
        if (Array.isArray(woJson.data)) {
          setAssignedWos(woJson.data);
        }
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [profile?.organizationId, profile?.id]);

  if (roleLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isMechanic && !roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Wrench className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Mechanic Dashboard</h2>
        <p className="text-muted-foreground text-center max-w-md">
          This view is for mechanics. Your current role is{" "}
          <strong>{profile?.roleName ?? "unknown"}</strong>.{"\n"}
          Ask your admin to assign you the Mechanic role to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {profile?.fullName ?? t("nav.dashboard")}
        </h1>
        <p className="text-muted-foreground">
          {t("nav.bayView")} —{" "}
          {new Date().toLocaleDateString("mn-MN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-3xl font-bold tabular-nums">
                {eod?.work_orders_completed ?? 0}
              </p>
            )}
            <CardDescription className="text-xs">
              {eod?.services_count ?? 0} services / {eod?.parts_count ?? 0}{" "}
              parts
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              Revenue Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-3xl font-bold tabular-nums">
                {formatMNT(eod?.total_revenue ?? 0)}
              </p>
            )}
            <CardDescription className="text-xs">
              From completed work orders
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="size-4" />
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-3xl font-bold tabular-nums">
                {assignedWos.length}
              </p>
            )}
            <CardDescription className="text-xs">
              Assigned to you
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Work Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-4" />
            My Work Orders
          </CardTitle>
          <CardDescription>
            Active and pending jobs assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : assignedWos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No active work orders assigned to you.
            </p>
          ) : (
            <div className="divide-y">
              {assignedWos.map((wo) => (
                <button
                  key={wo.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/work-orders/${wo.id}`)}
                  className="flex items-center justify-between w-full py-3 px-1 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {wo.customer_name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {wo.vehicle_plate ?? "—"} ·{" "}
                      {wo.description ?? "No description"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMNT(wo.total ?? 0)}
                    </span>
                    <Badge
                      className={STATUS_COLORS[wo.status] ?? "bg-muted"}
                      variant="secondary"
                    >
                      {wo.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
