"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useFuzzySearch } from "@zuiio/hooks";
import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { StatCard, StatCards } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  useCancelRefund,
  useRefundList,
  useRefundStats,
} from "@/lib/queries/use-refunds";
import { reportServerError } from "@/lib/sentry-report-server";
import { formatMNT } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";

const refundStatusConfig: Record<
  string,
  { icon: typeof Clock; className: string }
> = {
  pending: {
    icon: Clock,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  completed: {
    icon: CheckCircle,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  failed: {
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelled: {
    icon: XCircle,
    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  },
};

function RefundStatusBadge({ status }: { status: string }) {
  const cfg = refundStatusConfig[status] ?? refundStatusConfig.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${cfg.className}`}>
      <Icon className="size-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

interface RefundsTabProps {
  orgId: string;
}

export function RefundsTab({ orgId }: RefundsTabProps) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const cancelRefund = useCancelRefund(orgId);

  const { data: refunds, isPending: refundsLoading } = useRefundList(
    orgId,
    statusFilter as
      | "pending"
      | "completed"
      | "failed"
      | "cancelled"
      | undefined,
  );
  const { data: stats, isPending: statsLoading } = useRefundStats(orgId);

  const isPending = refundsLoading || statsLoading;
  const refundList = refunds ?? [];

  const filtered = useFuzzySearch(refundList, search, {
    keys: ["invoice_number", "reason", "reference"],
    threshold: 0.4,
    minQueryLength: 1,
  });

  const handleCancel = useCallback(
    async (refundId: string) => {
      if (!confirm(t("refund.confirmCancel"))) return;
      try {
        await cancelRefund.mutateAsync(refundId);
      } catch (error) {
        reportServerError("Unexpected error", error);
        // Error handled by mutation
      }
    },
    [t, cancelRefund],
  );

  const exportColumns = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "amount", label: "Amount", format: "currency" as const },
    { key: "method", label: "Method" },
    { key: "reason", label: "Reason" },
    { key: "status", label: "Status" },
    { key: "refunded_at", label: "Date", format: "date" as const },
  ];

  const columns = useMemo<ColumnDef<(typeof refundList)[number]>[]>(
    () => [
      {
        accessorKey: "invoice_number",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("common.invoiceNumber")}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">
            <HighlightText
              text={row.original.invoice_number || "—"}
              query={search}
            />
          </span>
        ),
      },
      {
        accessorKey: "customer_name",
        header: t("common.customer"),
        cell: ({ row }) => row.original.customer_name ?? "—",
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("common.amount")} />
        ),
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-destructive">
            -{formatMNT(Number(row.original.amount))}
          </span>
        ),
      },
      {
        accessorKey: "method",
        header: t("invoice.refundMethod"),
        cell: ({ row }) => (
          <span className="text-muted-foreground capitalize">
            {row.original.method.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: t("invoice.refundReason"),
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate text-muted-foreground">
            <HighlightText text={row.original.reason ?? "—"} query={search} />
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("common.status"),
        cell: ({ row }) => <RefundStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "refunded_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("common.date")} />
        ),
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.refunded_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("common.actions"),
        meta: { align: "right" },
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(row.original.id)}
              disabled={cancelRefund.isPending}
            >
              {cancelRefund.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              {t("common.cancel")}
            </Button>
          ) : null,
      },
    ],
    [t, search, handleCancel, cancelRefund.isPending],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <StatCards>
        <StatCard
          label={t("refund.totalRefunds")}
          value={isPending ? "—" : String(stats?.refundCount ?? 0)}
          icon={RotateCcw}
          loading={isPending}
          iconPosition="end"
        />
        <StatCard
          label={t("refund.totalRefunded")}
          value={isPending ? "—" : formatMNT(stats?.totalRefunded ?? 0)}
          icon={RotateCcw}
          loading={isPending}
          iconPosition="end"
        />
        <StatCard
          label={t("refund.pendingAmount")}
          value={isPending ? "—" : formatMNT(stats?.pendingAmount ?? 0)}
          icon={Clock}
          loading={isPending}
          iconPosition="end"
        />
        <StatCard
          label={t("refund.avgRefund")}
          value={
            isPending
              ? "—"
              : stats?.refundCount
                ? formatMNT((stats?.totalRefunded ?? 0) / stats.refundCount)
                : formatMNT(0)
          }
          icon={ArrowUpRight}
          loading={isPending}
          iconPosition="end"
        />
      </StatCards>

      {/* Toolbar */}
      <ListToolbar
        search={{
          placeholder: t("refund.searchPlaceholder"),
          value: search,
          onChange: setSearch,
          resultLabel: filtered.length
            ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
            : undefined,
          emptyLabel: search ? `No matches for "${search}"` : undefined,
        }}
        filters={
          <div className="flex gap-2 flex-wrap">
            {["", "completed", "pending", "cancelled", "failed"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
              </Button>
            ))}
          </div>
        }
        actions={
          <ExportButton
            data={refundList}
            columns={exportColumns}
            filename={`refunds-${new Date().toISOString().split("T")[0]}.xlsx`}
            sheetName="Refunds"
          />
        }
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            getRowId={(row) => row.id}
            pageSize={20}
            loading={isPending}
            insideCard
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <RotateCcw />
                  </EmptyMedia>
                  <EmptyTitle>{t("refund.noRefunds")}</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                  <p className="text-sm text-muted-foreground">
                    {t("refund.noRefundsDesc")}
                  </p>
                </EmptyContent>
              </Empty>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
