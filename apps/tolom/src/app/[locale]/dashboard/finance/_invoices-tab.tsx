"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useFuzzySearch } from "@zuiio/hooks";
import {
  ArrowUpRight,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { StatCard, StatCards } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import type { TableFeatures } from "@/components/ui/data-table-features";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import {
  useInvoiceStats,
  useInvoices,
  useSendInvoiceEmail,
} from "@/lib/queries/use-invoices";
import { reportServerError } from "@/lib/sentry-report-server";
import { formatCurrency } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";

// ── Shared helpers (module scope to avoid per-render rebuild) ──

function formatInvoiceDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    reportServerError("Unexpected error", error);
    return iso;
  }
}

const invoiceStatusConfig: Record<
  string,
  { labelKey: string; className: string }
> = {
  draft: {
    labelKey: "statusDraft",
    className:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
  },
  sent: {
    labelKey: "statusSent",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  },
  paid: {
    labelKey: "statusPaid",
    className:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
  },
  partial: {
    labelKey: "statusPartial",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  },
  overdue: {
    labelKey: "statusOverdue",
    className:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 animate-pulse",
  },
  unpaid: {
    labelKey: "statusUnpaid",
    className:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
  },
  cancelled: {
    labelKey: "statusCancelled",
    className:
      "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500",
  },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const t = useTranslations("finance") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const cfg = invoiceStatusConfig[status] ?? invoiceStatusConfig.draft;
  return (
    <Badge variant="outline" className={cfg.className}>
      {t(cfg.labelKey)}
    </Badge>
  );
}

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  balance_due: number;
  amount_paid: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  vehicle_plate: string | null;
  public_token: string;
  email_sent_at: string | null;
  issued_at: string;
  due_at: string | null;
}

interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  outstanding: number;
}

function InvoicesTab({ orgId }: { orgId: string | null }) {
  const t = useTranslations("finance") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const now = useClientNow();
  const {
    search,
    setSearch,
    status: filter,
    setStatus: setFilter,
  } = useTableFilters("finance-invoices");
  const { data: statsData, isPending: statsLoading } = useInvoiceStats(
    orgId ?? undefined,
  );
  const stats = statsData as InvoiceStats | undefined;
  const { data: invoices, isPending: invoicesLoading } = useInvoices(
    orgId ?? undefined,
    filter,
  );
  const invoiceListItems = (invoices ?? []) as unknown as InvoiceListItem[];
  const sendEmail = useSendInvoiceEmail(orgId ?? undefined);

  const isPending = statsLoading || (invoicesLoading && !invoices);

  const handleSendEmail = useCallback(
    async (invoiceId: string, _invoiceNumber: string) => {
      if (!orgId) return;
      try {
        await sendEmail.mutateAsync({ invoiceId });
      } catch (error) {
        reportServerError("Unexpected error", error);
        // Toast handled by useOrgMutation via successMessage/error handling
      }
    },
    [orgId, sendEmail],
  );

  const filtered = useFuzzySearch(invoiceListItems, search, {
    keys: ["invoice_number", "customer_name", "vehicle_plate"],
    threshold: 0.4,
    minQueryLength: 1,
  });

  const handleCopyLink = useCallback(
    (token: string) => {
      const url = `${window.location.origin}/invoice/${token}`;
      navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    },
    [t],
  );

  const invoiceExportColumns: ExportColumn<InvoiceListItem>[] = [
    { key: "invoice_number", label: t("invoiceNumber") },
    { key: "customer_name", label: t("customer") },
    { key: "vehicle_plate", label: t("vehicle") },
    { key: "status", label: t("status") },
    { key: "total", label: t("total"), format: "currency" },
    { key: "amount_paid", label: t("paid"), format: "currency" },
    { key: "balance_due", label: t("balance"), format: "currency" },
    { key: "issued_at", label: t("date"), format: "date" },
  ];

  const columns = useMemo<ColumnDef<TableFeatures, InvoiceListItem>[]>(
    () => [
      {
        accessorKey: "invoice_number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("invoiceNumber")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">
            <HighlightText text={row.original.invoice_number} query={search} />
          </span>
        ),
      },
      {
        accessorKey: "customer_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("customer")} />
        ),
        cell: ({ row }) =>
          row.original.customer_name ? (
            <HighlightText text={row.original.customer_name} query={search} />
          ) : (
            "\u2014"
          ),
      },
      {
        accessorKey: "vehicle_plate",
        header: t("vehicle"),
        cell: ({ row }) =>
          row.original.vehicle_plate ? (
            <HighlightText text={row.original.vehicle_plate} query={search} />
          ) : (
            "\u2014"
          ),
      },
      {
        accessorKey: "status",
        header: t("status"),
        cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("total")} />
        ),
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.original.total)}
          </span>
        ),
      },
      {
        accessorKey: "issued_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("date")} />
        ),
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatInvoiceDate(row.original.issued_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("actions"),
        meta: { align: "right" },
        cell: ({ row }) => {
          const inv = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {inv.email_sent_at && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[11px]"
                  title={t("sentOn", {
                    date: new Date(inv.email_sent_at).toLocaleDateString(),
                  })}
                >
                  <Mail className="size-3" />
                  {t("sentBadge")}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(inv.public_token)}
                title={t("copyPublicLink")}
              >
                <ArrowUpRight className="size-3.5" />
                {t("share")}
              </Button>
              {!inv.email_sent_at && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendEmail(inv.id, inv.invoice_number)}
                  disabled={sendEmail.isPending}
                  title={
                    inv.customer_email
                      ? t("sendInvoiceTo", {
                          email: inv.customer_email,
                        })
                      : t("noCustomerEmail")
                  }
                >
                  {sendEmail.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Mail className="size-3.5" />
                  )}
                  {t("email")}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [t, search, handleCopyLink, handleSendEmail, sendEmail.isPending],
  );

  return (
    <div className="flex flex-col gap-6">
      <StatCards>
        <StatCard
          label={t("totalInvoices")}
          value={isPending ? "\u2014" : String(stats?.total ?? 0)}
          icon={DollarSign}
          loading={isPending}
          iconPosition="end"
        />
        <StatCard
          label={t("sent")}
          value={isPending ? "\u2014" : String(stats?.sent ?? 0)}
          icon={ArrowUpRight}
          loading={isPending}
          iconPosition="end"
        />
        <StatCard
          label={t("paid")}
          value={isPending ? "\u2014" : String(stats?.paid ?? 0)}
          icon={TrendingUp}
          sub={
            stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : undefined
          }
          loading={isPending}
          iconPosition="end"
        />
        <StatCard
          label={t("outstanding")}
          value={isPending ? "\u2014" : formatCurrency(stats?.outstanding ?? 0)}
          icon={Clock}
          sub={`${stats?.overdue ?? 0} ${t("overdueCount")}`}
          loading={isPending}
          iconPosition="end"
        />
      </StatCards>
      <ListToolbar
        search={{
          placeholder: t("searchInvoices"),
          value: search,
          onChange: setSearch,
          resultLabel: filtered.length
            ? t("resultsCount", { count: filtered.length })
            : undefined,
          emptyLabel: search ? t("noMatches", { query: search }) : undefined,
        }}
        filters={
          <div className="flex gap-2 flex-wrap">
            {[
              "",
              "draft",
              "sent",
              "paid",
              "overdue",
              "partial",
              "cancelled",
            ].map((s) => (
              <Button
                key={s}
                variant={filter === s ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(s)}
              >
                {(
                  {
                    "": t("filterAll"),
                    draft: t("statusDraft"),
                    sent: t("statusSent"),
                    paid: t("statusPaid"),
                    overdue: t("statusOverdue"),
                    partial: t("statusPartial"),
                    cancelled: t("statusCancelled"),
                  } as Record<string, string>
                )[s] ?? s}
              </Button>
            ))}
          </div>
        }
        actions={
          <div className="flex gap-2">
            <ExportButton
              data={invoiceListItems}
              columns={invoiceExportColumns}
              filename={`invoices-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName={t("invoicesSheet")}
            />
          </div>
        }
      />
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
              <div className="px-5 py-16 text-center text-muted-foreground">
                No invoices found
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

export { InvoicesTab };
