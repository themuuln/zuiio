"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListToolbar } from "@/components/list-toolbar";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import { usePageHeader } from "@/hooks/use-page-header";

import type { ExportColumn } from "@/lib/export";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { useTableFilters } from "@/lib/hooks/use-url-filters";
import { useRouter } from "@/lib/i18n/navigation";
import { workOrderKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useUpdateWorkOrderStatus } from "@/lib/queries/use-work-order-detail";
import {
  useWorkOrders,
  type WorkOrderListItem,
} from "@/lib/queries/use-work-orders";
import { createColumns } from "./_columns";

// ── Status helpers ────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────

function getCustomerName(wo: WorkOrderListItem): string {
  return (
    [wo.customer?.first_name, wo.customer?.last_name]
      .filter(Boolean)
      .join(" ") || "—"
  );
}

function getVehicleDisplay(wo: WorkOrderListItem): string {
  if (!wo.vehicle) return "—";
  const parts = [
    wo.vehicle.make,
    wo.vehicle.model,
    wo.vehicle.plate_number,
  ].filter(Boolean);
  return parts.join(" ");
}

// ── Export columns ────────────────────────────────────────────

const exportColumns: ExportColumn<WorkOrderListItem>[] = [
  { key: "id", label: "WO #", value: (wo) => wo.id.slice(0, 8) },
  {
    key: "customer",
    label: "Customer",
    value: (wo) => getCustomerName(wo),
  },
  {
    key: "vehicle",
    label: "Vehicle",
    value: (wo) => getVehicleDisplay(wo),
  },
  {
    key: "mechanic",
    label: "Mechanic",
    value: (wo) => wo.mechanic?.full_name ?? "—",
  },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Date", format: "date" },
  { key: "grand_total", label: "Grand Total", format: "currency" },
  {
    key: "services_cost",
    label: "Services Cost",
    format: "currency",
  },
  {
    key: "parts_cost",
    label: "Parts Cost",
    format: "currency",
  },
  {
    key: "gross_profit",
    label: "Gross Profit",
    format: "currency",
  },
];

// ── Page ──────────────────────────────────────────────────────

export default function WorkOrdersPage() {
  const t = useTranslations();
  const { push } = useRouter();
  const now = useClientNow();
  const queryClient = useQueryClient();
  const {
    search,
    setSearch,
    status: statusFilter,
    setStatus,
  } = useTableFilters("work-orders");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { setNewWorkOrderSheetOpen } = usePageHeader();

  const { data: org } = useCurrentOrg();

  // ── Realtime: invalidate cache when core tables change ──────
  useRealtimeMulti({
    enabled: !!org?.orgId,
    tables: [
      {
        table: "work_orders",
        queryKey: workOrderKeys.all(org?.orgId ?? ""),
        filter: `organization_id=eq.${org?.orgId}`,
      },
      {
        table: "work_order_services",
        queryKey: workOrderKeys.all(org?.orgId ?? ""),
        filter: `organization_id=eq.${org?.orgId}`,
      },
      {
        table: "work_order_parts",
        queryKey: workOrderKeys.all(org?.orgId ?? ""),
        filter: `organization_id=eq.${org?.orgId}`,
      },
      {
        table: "mechanic_assignments",
        queryKey: workOrderKeys.all(org?.orgId ?? ""),
        filter: `organization_id=eq.${org?.orgId}`,
      },
    ],
  });

  const statusIdx = Math.max(
    0,
    STATUS_KEYS.indexOf(statusFilter as (typeof STATUS_KEYS)[number]),
  );
  const activeStatus = statusIdx > 0 ? STATUS_KEYS[statusIdx] : "";
  const {
    data: orders,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useWorkOrders(org?.orgId, activeStatus, search);

  useEffect(() => {
    if (orders) {
      setHasLoadedOnce(true);
    }
  }, [orders]);

  const updateStatus = useUpdateWorkOrderStatus(org?.orgId);

  const cancelWorkOrder = useMutation({
    mutationFn: async (woId: string) => {
      const res = await fetch(
        `/api/organizations/${org?.orgId}/work-orders/${woId}`,
        {
          method: "DELETE",
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.all(org?.orgId ?? ""),
      });
      toast.success(t("workOrders.cancelledSuccess"));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const list = orders ?? [];

  const statusCounts = useMemo(() => {
    if (!orders) return [];
    const counts: Record<string, number> = {};
    for (const wo of orders) {
      counts[wo.status] = (counts[wo.status] || 0) + 1;
    }
    return STATUS_KEYS.filter(Boolean)
      .map((key) => ({
        label: key,
        count: counts[key] ?? 0,
        color:
          key === "Cancelled"
            ? ("destructive" as const)
            : key === "Completed"
              ? ("outline" as const)
              : ("default" as const),
      }))
      .filter((sc) => sc.count > 0);
  }, [orders]);

  const handleStatusChange = useCallback(
    (woId: string, newStatus: string) => {
      updateStatus.mutate({ woId, status: newStatus });
    },
    [updateStatus],
  );

  const statusChips: FilterChip[] = useMemo(() => {
    // Only show chips for statuses that have at least one order
    const countMap: Record<string, number> = {};
    for (const sc of statusCounts) {
      countMap[sc.label] = sc.count;
    }
    return STATUS_KEYS.filter(
      (key) => key === "" || (countMap[key] ?? 0) > 0,
    ).map((key) => {
      const i = STATUS_KEYS.indexOf(key);
      return {
        key: key || "all",
        label: i === 0 ? t("common.all") : translateStatus(t, key),
        active: statusIdx === i,
        onClick: () => setStatus(key),
        colorDot: i > 0 ? (STATUS_COLORS[key] ?? "bg-gray-500") : undefined,
      };
    });
  }, [setStatus, statusIdx, t, statusCounts]);

  // Build column definitions with callbacks (stable reference)
  const columns = useMemo(
    () =>
      createColumns({
        onStatusChange: handleStatusChange,
        onCancel: (woId) => setCancelTarget(woId),
        updatePending: updateStatus.isPending,
      }),
    [handleStatusChange, updateStatus.isPending],
  );

  // ── Loading state ──────────────────────────────────────────

  if (isLoading && !hasLoadedOnce && !orders) {
    return (
      <div className="tablet-touch flex flex-col gap-3 tablet:gap-4 tablet:px-1">
        <div className="flex flex-col gap-0.5">
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("workOrders.title")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("workOrders.subtitle")}
          </Typography.Muted>
        </div>
        <ListToolbar
          search={{
            placeholder: t("workOrders.searchPlaceholder"),
            value: "",
            onChange: () => {},
            loading: false,
          }}
          actions={<Skeleton className="h-12 w-44" />}
        />
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="tablet-touch flex flex-col gap-3 tablet:gap-4 tablet:px-1">
      {/* ── AlertDialog for cancel confirmation ──────────────── */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("workOrders.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("workOrders.cancelDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel") as string}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelTarget) cancelWorkOrder.mutate(cancelTarget);
                setCancelTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("workOrders.confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("workOrders.title")}
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          {t("workOrders.subtitle")}
        </Typography.Muted>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <ListToolbar
        search={{
          placeholder:
            t("workOrders.searchPlaceholder") ||
            "Search by customer, plate, or ID...",
          value: search,
          onChange: setSearch,
          loading: isFetching,
          resultLabel: list.length
            ? `${list.length} result${list.length === 1 ? "" : "s"}`
            : undefined,
          emptyLabel: search ? `No matches for "${search}"` : undefined,
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
              filename={`work-orders-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Work Orders"
            />
            <Button onClick={() => setNewWorkOrderSheetOpen(true)}>
              <Plus className="size-4" /> {t("workOrders.newWorkOrder")}
            </Button>
          </div>
        }
      />

      {/* ── Status Summary Bar ──────────────────────────────── */}
      {statusCounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {statusCounts.map((sc) => (
            <Badge
              key={sc.label}
              variant={
                sc.label === "Cancelled"
                  ? "destructive"
                  : sc.label === "Completed"
                    ? "outline"
                    : "default"
              }
              className="gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setStatus(sc.label)}
            >
              <span
                className={`size-2 rounded-full ${STATUS_COLORS[sc.label] ?? "bg-gray-500"}`}
              />
              {translateStatus(t, sc.label)}{" "}
              <span className="font-mono text-xs">({sc.count})</span>
            </Badge>
          ))}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Typography.Text className="text-destructive">
              {error.message}
            </Typography.Text>
            <Button variant="outline" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>{t("workOrders.noWorkOrders")}</EmptyTitle>
            <EmptyDescription>{t("workOrders.subtitle")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setNewWorkOrderSheetOpen(true)}>
              {t("workOrders.createFirst")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        /* ── DataTable ──────────────────────────────────────── */
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={list}
              getRowId={(row) => row.id}
              pageSize={20}
              onRowClick={(row) => push(`/dashboard/work-orders/${row.id}`)}
              showColumnVisibility
              renderMobileCard={(wo) => {
                const customerName =
                  [wo.customer?.first_name, wo.customer?.last_name]
                    .filter(Boolean)
                    .join(" ") || "—";
                const vehicleDisplay = wo.vehicle
                  ? [wo.vehicle.make, wo.vehicle.model, wo.vehicle.plate_number]
                      .filter(Boolean)
                      .join(" ")
                  : "—";
                const daysSince = Math.floor(
                  (Date.now() - new Date(wo.created_at).getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                const ageDisplay =
                  daysSince === 0
                    ? "Today"
                    : daysSince === 1
                      ? "Yesterday"
                      : `${daysSince} days ago`;
                return (
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{wo.id.slice(0, 8)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {wo.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium truncate">
                        {customerName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {vehicleDisplay}
                      </span>
                    </div>
                    {wo.status !== "Cancelled" &&
                      (() => {
                        const STEPS = [
                          "New",
                          "Diagnosing",
                          "In Progress",
                          "Ready for Pickup",
                          "Completed",
                        ];
                        const COLORS = [
                          "#3B82F6",
                          "#EAB308",
                          "#F97316",
                          "#22C55E",
                          "#6B7280",
                        ];
                        const cur = STEPS.indexOf(wo.status);
                        if (cur < 0) return null;
                        return (
                          <div className="flex items-center gap-1 py-1">
                            {STEPS.map((s, i) => (
                              <div
                                key={s}
                                className="size-2 rounded-full transition-all"
                                style={{
                                  backgroundColor:
                                    i < cur
                                      ? COLORS[i]
                                      : i === cur
                                        ? COLORS[i]
                                        : "hsl(var(--muted-foreground) / 0.2)",
                                  ...(i === cur
                                    ? { boxShadow: `0 0 0 2px ${COLORS[i]}40` }
                                    : {}),
                                }}
                              />
                            ))}
                          </div>
                        );
                      })()}
                    <div className="flex items-center justify-between border-t border-border/50 pt-2 mt-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{wo.mechanic?.full_name ?? "—"}</span>
                        <span>·</span>
                        <span>{ageDisplay}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {wo.grand_total !== undefined
                          ? `₮${wo.grand_total.toLocaleString()}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
