"use client";

import type { Table } from "@tanstack/react-table";
import { useOrgMutation } from "@zuiio/query";
import { ClipboardList, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListPageShell } from "@/components/list-page-shell";
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
import { DataTable, DataTablePagination } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ChangeStatusDrawer } from "@/components/work-orders/change-status-drawer";
import { useClientNow } from "@/hooks/use-client-now";
import { useIsFirstLoad } from "@/hooks/use-is-first-load";
import { usePageHeader } from "@/hooks/use-page-header";
import type { ExportColumn } from "@/lib/export";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import { workOrderKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useUpdateWorkOrderStatus } from "@/lib/queries/use-work-order-detail";
import {
  useWorkOrders,
  type WorkOrderListItem,
} from "@/lib/queries/use-work-orders";
import { useSelectedBranchId } from "@/lib/stores";
import { createColumns, getAgeDisplay } from "./_columns";

// ── Status helpers ────────────────────────────────────────────

const MOBILE_STATUS_STEPS = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
] as const;

const MOBILE_STATUS_COLORS = [
  "var(--color-blue-500)",
  "var(--color-yellow-500)",
  "var(--color-orange-500)",
  "var(--color-green-500)",
  "var(--color-gray-500)",
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
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const tWorkOrders = useTranslations("workOrders") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const now = useClientNow();

  const { setDetailWorkOrderId } = usePageHeader();
  const {
    search,
    setSearch,
    status: statusFilter,
    setStatus,
  } = useTableFilters("work-orders");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [changeStatusWoId, setChangeStatusWoId] = useState<string | null>(null);
  const [changeStatusCurStatus, setChangeStatusCurStatus] = useState("");
  const [todayStr, setTodayStr] = useState("");
  const [mounted, setMounted] = useState(false);
  const tableRef = useRef<Table<WorkOrderListItem> | null>(null);

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
    setMounted(true);
  }, []);
  const { setNewWorkOrderSheetOpen } = usePageHeader();

  const { data: org } = useCurrentOrg();
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

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
    isPending,
    isFetching,
    error,
    refetch,
  } = useWorkOrders(org?.orgId, activeStatus, search, branchFilter);
  const isFirstLoad = useIsFirstLoad(!!orders);

  const updateStatus = useUpdateWorkOrderStatus(org?.orgId);

  const cancelWorkOrder = useOrgMutation<unknown, { id: string }>({
    endpoint: (vars) =>
      `/api/organizations/${org?.orgId}/work-orders/${vars.id}`,
    method: "DELETE",
    queryKey: workOrderKeys.all(org?.orgId ?? ""),
    successMessage: "Work order deleted",
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
    const countMap: Record<string, number> = {};
    for (const sc of statusCounts) {
      countMap[sc.label] = sc.count;
    }
    return STATUS_KEYS.map((key) => {
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

  const columns = useMemo(
    () =>
      createColumns({
        onStatusChange: handleStatusChange,
        onCancel: (woId) => setCancelTarget(woId),
        updatePending: updateStatus.isPending,
        onViewDetail: (woId) => setDetailWorkOrderId(woId),
        onChangeStatus: (woId, status) => {
          setChangeStatusWoId(woId);
          setChangeStatusCurStatus(status);
        },
      }),
    [handleStatusChange, updateStatus.isPending, setDetailWorkOrderId],
  );

  const columnLabels = useMemo(
    () => ({
      id: tWorkOrders("id"),
      customer: tWorkOrders("customer"),
      vehicle: tWorkOrders("vehicle"),
      mechanic: tWorkOrders("mechanic"),
      status: tWorkOrders("status"),
      age: tWorkOrders("age"),
      grand_total: tWorkOrders("total"),
      services_cost: tWorkOrders("servicesCost"),
      parts_cost: tWorkOrders("partsCost"),
      gross_profit: tWorkOrders("grossProfit"),
      margin_percent: tWorkOrders("margin"),
      loss_reason: tWorkOrders("lossReason"),
    }),
    [tWorkOrders],
  );

  return (
    <>
      <ListPageShell
        title={t("workOrders.title")}
        description={t("workOrders.subtitle")}
        loading={isPending && isFirstLoad && !orders}
        error={error?.message ?? null}
        onRetry={refetch}
        headerAction={
          <Button onClick={() => setNewWorkOrderSheetOpen(true)}>
            <Plus className="size-4" /> {t("workOrders.newWorkOrder")}
          </Button>
        }
      >
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
                filename={`work-orders-${todayStr || "export"}.xlsx`}
                sheetName="Work Orders"
              />
            </div>
          }
        />

        {list.length === 0 ? (
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
          <Card className="rounded-sm py-0">
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={list}
                getRowId={(row) => row.id}
                pageSize={20}
                onRowClick={(row) => setDetailWorkOrderId(row.id)}
                showColumnVisibility
                defaultColumnVisibility={{ id: false }}
                columnLabels={columnLabels}
                noPagination
                onTableReady={(t) => {
                  tableRef.current = t;
                }}
                renderMobileCard={(wo, _table) => {
                  const showCustomer =
                    _table.getColumn("customer")?.getIsVisible() ?? true;
                  const showVehicle =
                    _table.getColumn("vehicle")?.getIsVisible() ?? true;
                  const showMechanic =
                    _table.getColumn("mechanic")?.getIsVisible() ?? true;
                  const showAge =
                    _table.getColumn("age")?.getIsVisible() ?? true;
                  const showTotal =
                    _table.getColumn("grand_total")?.getIsVisible() ?? true;
                  const showStatusLine =
                    _table.getColumn("status")?.getIsVisible() ?? true;
                  const plateNumber = wo.vehicle?.plate_number || "—";
                  const vehicleModel = wo.vehicle
                    ? [wo.vehicle.make, wo.vehicle.model]
                        .filter(Boolean)
                        .join(" ")
                    : null;
                  const customerName =
                    [wo.customer?.first_name, wo.customer?.last_name]
                      .filter(Boolean)
                      .join(" ") || "—";
                  const daysSince = Math.floor(
                    (now.getTime() - new Date(wo.created_at).getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div className="flex flex-col gap-2 text-sm">
                      {(showVehicle || showStatusLine) && (
                        <div className="flex items-center justify-between">
                          {showVehicle && (
                            <span className="font-semibold tabular-nums">
                              {plateNumber}
                            </span>
                          )}
                          {showStatusLine && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {wo.status}
                            </Badge>
                          )}
                        </div>
                      )}
                      {showVehicle && vehicleModel && (
                        <span className="text-xs text-muted-foreground truncate">
                          {vehicleModel}
                        </span>
                      )}
                      {showCustomer && customerName !== "—" && (
                        <span className="text-xs text-muted-foreground truncate">
                          {customerName}
                        </span>
                      )}
                      {showStatusLine &&
                        wo.status !== "Cancelled" &&
                        (() => {
                          const cur = MOBILE_STATUS_STEPS.indexOf(
                            wo.status as (typeof MOBILE_STATUS_STEPS)[number],
                          );
                          if (cur < 0) return null;
                          return (
                            <div className="flex items-center gap-1 py-1">
                              {MOBILE_STATUS_STEPS.map((s, i) => (
                                <div
                                  key={s}
                                  className="size-2 rounded-full transition-all"
                                  style={{
                                    backgroundColor:
                                      i <= cur
                                        ? MOBILE_STATUS_COLORS[i]
                                        : "hsl(var(--muted-foreground) / 0.2)",
                                    ...(i === cur
                                      ? {
                                          boxShadow: `0 0 0 2px ${MOBILE_STATUS_COLORS[i]}40`,
                                        }
                                      : {}),
                                  }}
                                />
                              ))}
                            </div>
                          );
                        })()}
                      {(showMechanic || showAge || showTotal) && (
                        <div className="flex items-center justify-between border-t border-border/50 pt-2 mt-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {showMechanic && (
                              <span>{wo.mechanic?.full_name ?? "—"}</span>
                            )}
                            {showMechanic && showAge && <span>·</span>}
                            {showAge && (
                              <span>
                                {mounted
                                  ? getAgeDisplay(daysSince, tWorkOrders)
                                  : "—"}
                              </span>
                            )}
                          </div>
                          {showTotal && (
                            <span className="text-sm font-semibold tabular-nums">
                              {wo.grand_total !== undefined
                                ? `₮${wo.grand_total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                                : "—"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </CardContent>
          </Card>
        )}

        {tableRef.current && list.length > 0 && (
          <DataTablePagination
            table={tableRef.current}
            showColumnVisibility
            columnLabels={columnLabels}
          />
        )}
      </ListPageShell>

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
                if (cancelTarget) cancelWorkOrder.mutate({ id: cancelTarget });
                setCancelTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("workOrders.confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChangeStatusDrawer
        open={changeStatusWoId !== null}
        onOpenChange={(open) => {
          if (!open) setChangeStatusWoId(null);
        }}
        workOrderId={changeStatusWoId ?? ""}
        currentStatus={changeStatusCurStatus}
      />
    </>
  );
}

export { WorkOrdersPage };
