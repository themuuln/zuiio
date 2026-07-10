"use client";

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
import { useState } from "react";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCancelRefund,
  useRefundList,
  useRefundStats,
} from "@/lib/queries/use-refunds";
import { reportServerError } from "@/lib/sentry-report-server";
import { formatMNT } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";
import { KpiCard } from "./_kpi-card";

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
  const t = useTranslations();
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

  const handleCancel = async (refundId: string) => {
    if (!confirm(t("refund.confirmCancel"))) return;
    try {
      await cancelRefund.mutateAsync(refundId);
    } catch (error) {
      reportServerError("Unexpected error", error);
      // Error handled by mutation
    }
  };

  const exportColumns = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "amount", label: "Amount", format: "currency" as const },
    { key: "method", label: "Method" },
    { key: "reason", label: "Reason" },
    { key: "status", label: "Status" },
    { key: "refunded_at", label: "Date", format: "date" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("refund.totalRefunds")}
          value={isPending ? "—" : String(stats?.refundCount ?? 0)}
          icon={RotateCcw}
          loading={isPending}
        />
        <KpiCard
          label={t("refund.totalRefunded")}
          value={isPending ? "—" : formatMNT(stats?.totalRefunded ?? 0)}
          icon={RotateCcw}
          loading={isPending}
        />
        <KpiCard
          label={t("refund.pendingAmount")}
          value={isPending ? "—" : formatMNT(stats?.pendingAmount ?? 0)}
          icon={Clock}
          loading={isPending}
        />
        <KpiCard
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
        />
      </div>

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("common.invoiceNumber")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("common.customer")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    {t("common.amount")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("invoice.refundMethod")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("invoice.refundReason")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-center font-medium text-muted-foreground">
                    {t("common.status")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    {t("common.date")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-16">
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-16">
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
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((refund) => (
                    <TableRow
                      key={refund.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-3.5 font-mono text-xs font-medium">
                        <HighlightText
                          text={refund.invoice_number || "—"}
                          query={search}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        {refund.customer_name ?? "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right font-medium tabular-nums text-destructive">
                        -{formatMNT(Number(refund.amount))}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-muted-foreground capitalize">
                        {refund.method.replace("_", " ")}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-muted-foreground max-w-[200px] truncate">
                        <HighlightText
                          text={refund.reason ?? "—"}
                          query={search}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-center">
                        <RefundStatusBadge status={refund.status} />
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right text-muted-foreground">
                        {new Date(refund.refunded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right">
                        {refund.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(refund.id)}
                            disabled={cancelRefund.isPending}
                          >
                            {cancelRefund.isPending ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <XCircle className="size-3.5" />
                            )}
                            {t("common.cancel")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
