"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExportColumn } from "@/lib/export";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { workOrderKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useUpdateWorkOrderStatus } from "@/lib/queries/use-work-order-detail";
import {
  useWorkOrders,
  type WorkOrderListItem,
} from "@/lib/queries/use-work-orders";
import { formatMNT } from "@/lib/utils";

// ── Sort ──────────────────────────────────────────────────────

type SortKey =
  | "id"
  | "customer"
  | "status"
  | "created_at"
  | "grand_total"
  | "mechanic"
  | "profit";
type SortDir = "asc" | "desc";
interface SortConfig {
  key: SortKey;
  dir: SortDir;
}

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

// All statuses available for quick-change (excluding current)
const STATUS_OPTIONS = STATUS_KEYS.filter(Boolean) as string[];

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

function getDaysSince(dateStr: string, now: Date): number {
  const created = new Date(dateStr);
  return Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getAgeDisplay(
  days: number,
  t: (key: string, params?: Record<string, number>) => string,
): string {
  if (days === 0) return t("workOrders.today");
  if (days === 1) return t("workOrders.yesterday");
  return t("workOrders.daysAgo", { days });
}

function getSortValue(wo: WorkOrderListItem, key: SortKey): string | number {
  switch (key) {
    case "id":
      return wo.id;
    case "customer":
      return getCustomerName(wo).toLowerCase();
    case "status":
      return wo.status;
    case "created_at":
      return wo.created_at;
    case "grand_total":
      return wo.grand_total ?? 0;
    case "mechanic":
      return wo.mechanic?.full_name?.toLowerCase() ?? "";
    case "profit":
      return wo.gross_profit ?? 0;
  }
}

// ── Sort header ───────────────────────────────────────────────

function SortHeader({
  label,
  sortKey,
  current,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortConfig;
  onSort: (key: SortKey) => void;
}) {
  const active = current.key === sortKey;
  const dir = active ? current.dir : null;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-medium text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {!active && <ArrowUpDown className="size-3 opacity-40" />}
      {active && dir === "asc" && <ArrowUp className="size-3" />}
      {active && dir === "desc" && <ArrowDown className="size-3" />}
    </button>
  );
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
  {
    key: "margin_percent",
    label: "Margin %",
    value: (wo) =>
      wo.margin_percent !== undefined
        ? `${wo.margin_percent.toFixed(1)}%`
        : "—",
  },
];

// ── Page ──────────────────────────────────────────────────────

export default function WorkOrdersPage() {
  const t = useTranslations();
  const { push } = useRouter();
  const now = useClientNow();
  const queryClient = useQueryClient();
  const [statusIdx, setStatusIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortConfig>({
    key: "created_at",
    dir: "desc",
  });
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data: org } = useCurrentOrg();
  const status = statusIdx > 0 ? STATUS_KEYS[statusIdx] : "";
  const {
    data: orders,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useWorkOrders(org?.orgId, status, search);

  const { registerTab, setOpen } = useRightSidebar();

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

  // ── Sorted list ─────────────────────────────────────────────

  const list = useMemo(() => {
    const raw = orders ?? [];
    const sorted = raw.toSorted((a, b) => {
      const va = getSortValue(a, sort.key);
      const vb = getSortValue(b, sort.key);
      const cmp =
        typeof va === "string"
          ? va.localeCompare(vb as string)
          : (va as number) - (vb as number);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [orders, sort]);

  const statusCounts = useMemo(() => {
    if (!orders) return [];
    const counts: Record<string, number> = {};
    for (const wo of orders) {
      counts[wo.status] = (counts[wo.status] || 0) + 1;
    }
    return STATUS_KEYS.filter(Boolean).map((key) => ({
      label: key,
      count: counts[key] ?? 0,
      color:
        key === "Cancelled"
          ? ("destructive" as const)
          : key === "Completed"
            ? ("outline" as const)
            : ("default" as const),
    }));
  }, [orders]);

  const todayWOs = useMemo(() => {
    if (!orders) return [];
    const todayStr = now.toISOString().split("T")[0];
    return orders
      .filter((wo) => wo.created_at.startsWith(todayStr))
      .map((wo) => ({
        id: wo.id,
        primary: `#${wo.id.slice(0, 8)} - ${getCustomerName(wo)}`,
        secondary: wo.mechanic?.full_name ?? null,
        timestamp: new Date(wo.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        href: `/dashboard/work-orders/${wo.id}`,
      }));
  }, [orders, now]);

  useEffect(() => {
    registerTab("stats", "Stats", (
      <StatusSummary items={statusCounts} title="Work Orders" />
    ));
    registerTab("activity", "Activity", (
      <RecentList items={todayWOs} title="Today" emptyMessage="No work orders today" />
    ));
    setOpen(true);
  }, [registerTab, setOpen, statusCounts, todayWOs]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleSort = (key: SortKey) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusChange = (woId: string, newStatus: string) => {
    updateStatus.mutate({ woId, status: newStatus });
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

  // ── Loading state ──────────────────────────────────────────

  if (isLoading && !orders) {
    return (
      <div className="tablet-touch flex flex-col gap-3 tablet:gap-4 tablet:px-1">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("workOrders.title")}
          </h1>
          <p className="text-muted-foreground">{t("workOrders.subtitle")}</p>
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
            <TableSkeleton />
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
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("workOrders.title")}
        </h1>
        <p className="text-muted-foreground">{t("workOrders.subtitle")}</p>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
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
              filename={`work-orders-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Work Orders"
            />
            <Link href="/dashboard/work-orders/new">
              <Button>
                <Plus className="size-4" /> {t("workOrders.newWorkOrder")}
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Error ────────────────────────────────────────────── */}
      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <p className="text-destructive">{error.message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        /* ── Empty state ──────────────────────────────────── */
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <p className="text-muted-foreground">
              {t("workOrders.noWorkOrders")}
            </p>
            <Link href="/dashboard/work-orders/new">
              <Button>{t("workOrders.createFirst")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* ── Table ──────────────────────────────────────────── */
        <Card>
          <CardContent className="p-0">
            <Table className="[&_td]:p-1.5 [&_th]:h-8">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">
                    <SortHeader
                      label={t("workOrders.id")}
                      sortKey="id"
                      current={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortHeader
                      label={t("workOrders.customer")}
                      sortKey="customer"
                      current={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="hidden md:table-cell w-44">
                    {t("workOrders.vehicle")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell w-32">
                    <SortHeader
                      label={t("workOrders.mechanic")}
                      sortKey="mechanic"
                      current={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-36">
                    <SortHeader
                      label={t("workOrders.status")}
                      sortKey="status"
                      current={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="hidden sm:table-cell w-24">
                    <SortHeader
                      label={t("workOrders.age")}
                      sortKey="created_at"
                      current={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-28 text-right">
                    <SortHeader
                      label={t("workOrders.total")}
                      sortKey="grand_total"
                      current={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="hidden xl:table-cell w-28 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {t("workOrders.servicesCost")}
                  </TableHead>
                  <TableHead className="hidden xl:table-cell w-28 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {t("workOrders.partsCost")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell w-28 text-right">
                    <SortHeader
                      label={t("workOrders.grossProfit")}
                      sortKey="profit"
                      current={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell w-24 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {t("workOrders.margin")}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((wo) => {
                  const days = getDaysSince(wo.created_at, now);
                  return (
                    <TableRow
                      key={wo.id}
                      className="cursor-pointer"
                      onClick={() =>
                        push(`/dashboard/work-orders/${wo.id}`)
                      }
                    >
                      {/* WO# */}
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        #{wo.id.slice(0, 8)}
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium truncate max-w-[200px]">
                            {getCustomerName(wo)}
                          </p>
                          {wo.vehicle?.plate_number && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {getVehicleDisplay(wo)}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Vehicle (desktop) */}
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {getVehicleDisplay(wo)}
                      </TableCell>

                      {/* Mechanic (desktop) */}
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {wo.mechanic?.full_name ?? "—"}
                      </TableCell>

                      {/* Status */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-white cursor-pointer ${STATUS_COLORS[wo.status] ?? "bg-gray-500"} hover:opacity-80 transition-opacity`}
                              role="button"
                              tabIndex={0}
                            >
                              <span>{wo.status}</span>
                              <ArrowUpDown className="size-3 opacity-60" />
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="min-w-[160px]"
                          >
                            {STATUS_OPTIONS.flatMap((s) =>
                              s !== wo.status && s !== "Cancelled"
                                ? [
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={() => handleStatusChange(wo.id, s)}
                                      disabled={updateStatus.isPending}
                                    >
                                      {translateStatus(t, s)}
                                    </DropdownMenuItem>,
                                  ]
                                : [],
                            )}
                            {wo.status !== "Cancelled" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setCancelTarget(wo.id)}
                                >
                                  <Trash2 className="size-3.5 mr-2" />
                                  {t("workOrders.cancelWorkOrder")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* Age */}
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground tabular-nums">
                        {getAgeDisplay(days, t)}
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {wo.grand_total !== undefined
                          ? `₮${wo.grand_total.toLocaleString()}`
                          : "—"}
                      </TableCell>

                      {/* Services Cost */}
                      <TableCell className="hidden xl:table-cell text-right text-sm tabular-nums text-muted-foreground">
                        {wo.services_cost !== undefined
                          ? formatMNT(wo.services_cost)
                          : "—"}
                      </TableCell>

                      {/* Parts Cost */}
                      <TableCell className="hidden xl:table-cell text-right text-sm tabular-nums text-muted-foreground">
                        {wo.parts_cost !== undefined
                          ? formatMNT(wo.parts_cost)
                          : "—"}
                      </TableCell>

                      {/* Gross Profit */}
                      <TableCell className="hidden lg:table-cell text-right text-sm font-medium tabular-nums">
                        {wo.gross_profit !== undefined ? (
                          <span
                            className={
                              wo.gross_profit > 0
                                ? "text-green-600 dark:text-green-400"
                                : wo.gross_profit < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : ""
                            }
                          >
                            {formatMNT(wo.gross_profit)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Margin % */}
                      <TableCell className="hidden lg:table-cell text-right text-sm tabular-nums">
                        {wo.margin_percent !== undefined ? (
                          <span
                            className={
                              wo.margin_percent > 0
                                ? "text-green-600 dark:text-green-400"
                                : wo.margin_percent < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-muted-foreground"
                            }
                          >
                            {wo.margin_percent.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>

                      {/* Actions button */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <span
                              className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                              role="button"
                              tabIndex={0}
                            >
                              <MoreHorizontal className="size-4" />
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-[140px]"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                push(`/dashboard/work-orders/${wo.id}`)
                              }
                            >
                              {t("workOrders.viewDetails")}
                            </DropdownMenuItem>
                            {wo.status !== "Cancelled" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setCancelTarget(wo.id)}
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                {t("workOrders.cancelWorkOrder")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead className="hidden md:table-cell">
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead className="hidden lg:table-cell">
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-14" />
          </TableHead>
          <TableHead className="hidden sm:table-cell">
            <Skeleton className="h-4 w-12" />
          </TableHead>
          <TableHead className="text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
          </TableHead>
          <TableHead className="hidden xl:table-cell text-right">
            <Skeleton className="h-4 w-14 ml-auto" />
          </TableHead>
          <TableHead className="hidden xl:table-cell text-right">
            <Skeleton className="h-4 w-14 ml-auto" />
          </TableHead>
          <TableHead className="hidden lg:table-cell text-right">
            <Skeleton className="h-4 w-14 ml-auto" />
          </TableHead>
          <TableHead className="hidden lg:table-cell text-right">
            <Skeleton className="h-4 w-12 ml-auto" />
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={`row-${i}`}>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20 rounded-full" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-4 w-12" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-4 w-16 ml-auto" />
            </TableCell>
            <TableCell className="hidden xl:table-cell text-right">
              <Skeleton className="h-4 w-14 ml-auto" />
            </TableCell>
            <TableCell className="hidden xl:table-cell text-right">
              <Skeleton className="h-4 w-14 ml-auto" />
            </TableCell>
            <TableCell className="hidden lg:table-cell text-right">
              <Skeleton className="h-4 w-14 ml-auto" />
            </TableCell>
            <TableCell className="hidden lg:table-cell text-right">
              <Skeleton className="h-4 w-12 ml-auto" />
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
