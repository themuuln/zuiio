"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExportColumn } from "@/lib/export";
import { Link } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useWorkOrders, type WorkOrderListItem } from "@/lib/queries/use-work-orders";

const exportColumns: ExportColumn<WorkOrderListItem>[] = [
  { key: "id", label: "WO #", value: (wo) => wo.id.slice(0, 8) },
  {
    key: "customer",
    label: "Customer",
    value: (wo) =>
      `${wo.customer?.first_name ?? ""} ${wo.customer?.last_name ?? ""}`.trim() ||
      "—",
  },
  {
    key: "vehicle",
    label: "Vehicle",
    value: (wo) => wo.vehicle?.plate_number ?? "—",
  },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Date", format: "date" },
  { key: "grand_total", label: "Grand Total", format: "currency" },
];

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

const STATUS_KEYS = [
  "",
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

export default function WorkOrdersPage() {
  const t = useTranslations();
  const [statusIdx, setStatusIdx] = useState(0);
  const [search, setSearch] = useState("");

  const { data: org } = useCurrentOrg();
  const status = statusIdx > 0 ? STATUS_KEYS[statusIdx] : "";
  const { data: orders, isLoading, isFetching, error, refetch } = useWorkOrders(org?.orgId, status, search);

  const list = orders ?? [];

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const statusChips: FilterChip[] = useMemo(
    () =>
      STATUS_KEYS.map((key, i) => ({
        key: key || "all",
        label: i === 0 ? t("common.all") : translateStatus(t, key),
        active: statusIdx === i,
        onClick: () => setStatusIdx(i),
        colorDot: i > 0 ? (STATUS_COLORS[key] ?? "bg-gray-500") : undefined,
      })),
    [statusIdx, t],
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("mn-MN", {
      day: "numeric",
      month: "short",
    });

  return (
    <div className="flex flex-col gap-6 tablet:gap-8 tablet:px-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("workOrders.title")}
        </h1>
        <p className="text-muted-foreground">{t("workOrders.subtitle")}</p>
      </div>

      <ListToolbar
        search={{
          placeholder:
            t("workOrders.searchPlaceholder") ||
            "Search by customer, plate, or ID...",
          value: search,
          onChange: handleSearch,
          loading: isFetching,
        }}
        filters={<FilterChips items={statusChips} />}
        stats={
          <span>
            {list.length}{" "}
            {list.length === 1
              ? t("workOrders.workOrder")
              : t("workOrders.workOrders")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={list}
              columns={exportColumns}
              filename={`work-orders-${new Date().toISOString().split("T")[0]}.xlsx`}
              sheetName="Work Orders"
            />
            <Link href="/dashboard/work-orders/new">
              <Button size="lg" className="h-12">
                <Plus className="size-5" /> {t("workOrders.newWorkOrder")}
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading && !orders ? (
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
              <p className="text-destructive">{error.message}</p>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : list.length === 0 ? (
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
              {list.map((wo) => (
                <Link
                  key={wo.id}
                  href={`/dashboard/work-orders/${wo.id}`}
                  className="flex min-h-[72px] items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50 tablet:px-5"
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
