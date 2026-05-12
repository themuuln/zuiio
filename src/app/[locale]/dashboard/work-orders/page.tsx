"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FilterChips, type FilterChip } from "@/components/filter-chips";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";

interface WorkOrder {
  id: string;
  status: string;
  created_at: string;
  mechanic_id: string | null;
  customer: { first_name: string; last_name: string | null } | null;
  vehicle: { plate_number: string } | null;
  grand_total?: number;
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-500",
  Diagnosing: "bg-yellow-500",
  "In Progress": "bg-orange-500",
  "Ready for Pickup": "bg-green-500",
  Completed: "bg-gray-500",
  Cancelled: "bg-red-500",
};

const STATUS_NAMES: Record<string, string> = {
  New: "statusNew",
  Diagnosing: "statusDiagnosing",
  "In Progress": "statusInProgress",
  "Ready for Pickup": "statusReadyForPickup",
  Completed: "statusCompleted",
  Cancelled: "statusCancelled",
};

function translateStatus(t: (key: string) => string, key: string): string {
  const nameKey = STATUS_NAMES[key];
  return nameKey ? t(`workOrders.${nameKey}`) : key;
}

export default function WorkOrdersPage() {
  const t = useTranslations();
  const STATUS_KEYS = [
    "",
    "New",
    "Diagnosing",
    "In Progress",
    "Ready for Pickup",
    "Completed",
    "Cancelled",
  ] as const;
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusIdx, setStatusIdx] = useState(0);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.id) setOrgId(d.data.id);
      })
      .catch(() => {
        toast.error("Failed to load organization");
        setError("Failed to load organization");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusIdx > 0) params.set("status", STATUS_KEYS[statusIdx]);
    if (search) params.set("q", search);
    const query = params.toString();
    fetch(`/api/organizations/${orgId}/work-orders${query ? `?${query}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error.message);
        else setOrders(d.data ?? []);
      })
      .catch(() => setError("Failed to load work orders"))
      .finally(() => setLoading(false));
  }, [orgId, statusIdx, STATUS_KEYS[statusIdx], search]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const statusChips: FilterChip[] = useMemo(
    () =>
      STATUS_KEYS.map((key, i) => ({
        key: key || "all",
        label: i === 0 ? t("common.all") : translateStatus(t, key),
        active: statusIdx === i,
        onClick: () => setStatusIdx(i),
        colorDot: i > 0 ? STATUS_COLORS[key] ?? "bg-gray-500" : undefined,
      })),
    [statusIdx, t],
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("mn-MN", {
      day: "numeric",
      month: "short",
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("workOrders.title")}
        </h1>
        <p className="text-muted-foreground">{t("workOrders.subtitle")}</p>
      </div>

      <ListToolbar
        search={{
          placeholder: t("workOrders.searchPlaceholder") || "Search by customer, plate, or ID...",
          value: search,
          onChange: handleSearch,
          loading,
        }}
        filters={<FilterChips items={statusChips} />}
        stats={
          <span>
            {orders.length} {orders.length === 1 ? t("workOrders.workOrder") : t("workOrders.workOrders")}
          </span>
        }
        actions={
          <Link href="/dashboard/work-orders/new">
            <Button size="lg" className="h-12">
              <Plus className="size-5" /> {t("workOrders.newWorkOrder")}
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 px-4 py-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => setLoading(true)}>
                Retry
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <p className="text-muted-foreground">
                {t("workOrders.noWorkOrders")}
              </p>
              <Link href="/dashboard/work-orders/new">
                <Button>{t("workOrders.createFirst")}</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((wo) => (
                <Link
                  key={wo.id}
                  href={`/dashboard/work-orders/${wo.id}`}
                  className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50 cursor-pointer min-h-[64px]"
                >
                  <span className="font-mono text-sm text-muted-foreground w-20 shrink-0">
                    #{wo.id.slice(0, 8)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {wo.customer
                        ? `${wo.customer.first_name} ${wo.customer.last_name ?? ""}`.trim()
                        : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {wo.vehicle?.plate_number ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full text-white shrink-0 ${STATUS_COLORS[wo.status] ?? "bg-gray-500"}`}
                  >
                    {wo.status}
                  </span>
                  <span className="text-sm text-muted-foreground shrink-0 hidden sm:block">
                    {formatDate(wo.created_at)}
                  </span>
                  {wo.grand_total !== undefined && (
                    <span className="font-medium text-sm shrink-0 tabular-nums">
                      ₮{wo.grand_total.toLocaleString()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
