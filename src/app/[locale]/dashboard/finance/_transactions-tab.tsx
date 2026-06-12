"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";
import { EmptyFinanceState } from "./_empty-finance-state";

interface WorkOrderRow {
  id: string;
  status: string;
  created_at: string;
  customer?: { first_name?: string | null; last_name?: string | null } | null;
  vehicle?: { plate_number?: string | null } | null;
  services: Array<{ final_price: number }>;
  parts: Array<{ final_price: number }>;
}

interface TransactionsTabProps {
  hasAnyData: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filteredWorkOrders: WorkOrderRow[];
  data: { recentWorkOrders?: WorkOrderRow[] } | null;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function getGrandTotal(wo: WorkOrderRow) {
  const svcTotal = wo.services.reduce((s, x) => s + Number(x.final_price), 0);
  const prtTotal = wo.parts.reduce((s, x) => s + Number(x.final_price), 0);
  return { svcTotal, prtTotal, grandTotal: svcTotal + prtTotal };
}

export function TransactionsTab({
  hasAnyData,
  search,
  onSearchChange,
  filteredWorkOrders,
  data,
}: TransactionsTabProps) {
  const t = useTranslations();
  const financeT = useTranslations("finance");
  const now = useClientNow();

  const exportColumns: ExportColumn<WorkOrderRow>[] = [
    {
      key: "id",
      label: financeT("workOrderNumberShort"),
      value: (wo) => wo.id.slice(0, 8),
    },
    {
      key: "customer",
      label: financeT("customerColumn"),
      value: (wo) => {
        const c = wo.customer;
        return c ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() : "—";
      },
    },
    {
      key: "vehicle",
      label: financeT("vehicleColumn"),
      value: (wo) => wo.vehicle?.plate_number ?? "—",
    },
    { key: "status", label: financeT("statusColumn") },
    {
      key: "services",
      label: financeT("servicesColumn"),
      format: "currency",
      value: (wo) => wo.services.reduce((s, x) => s + Number(x.final_price), 0),
    },
    {
      key: "parts",
      label: financeT("partsColumn"),
      format: "currency",
      value: (wo) => wo.parts.reduce((s, x) => s + Number(x.final_price), 0),
    },
    {
      key: "grand_total",
      label: financeT("totalColumn"),
      format: "currency",
      value: (wo) => {
        return (
          wo.services.reduce((s, x) => s + Number(x.final_price), 0) +
          wo.parts.reduce((s, x) => s + Number(x.final_price), 0)
        );
      },
    },
    { key: "created_at", label: financeT("dateColumn"), format: "date" },
  ];

  const columns: ColumnDef<WorkOrderRow>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="#" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            <HighlightText
              text={`${row.original.id.slice(0, 8)}...`}
              query={search}
            />
          </span>
        ),
      },
      {
        id: "customer",
        accessorFn: (row) => {
          const c = row.customer;
          return c ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() : "";
        },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={financeT("customerColumn")}
          />
        ),
        cell: ({ row }) => {
          const c = row.original.customer;
          const name = c
            ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()
            : "";
          return name ? <HighlightText text={name} query={search} /> : "—";
        },
      },
      {
        id: "vehicle",
        accessorFn: (row) => row.vehicle?.plate_number ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={financeT("vehicleColumn")}
          />
        ),
        cell: ({ row }) =>
          row.original.vehicle?.plate_number ? (
            <span className="text-muted-foreground">
              <HighlightText
                text={row.original.vehicle.plate_number}
                query={search}
              />
            </span>
          ) : (
            <span className="text-muted-foreground">\u2014</span>
          ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={financeT("statusColumn")}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.status}</Badge>
        ),
      },
      {
        id: "services",
        accessorFn: (row) =>
          row.services.reduce((s, x) => s + Number(x.final_price), 0),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={financeT("servicesColumn")}
          />
        ),
        cell: ({ row }) => {
          const { svcTotal } = getGrandTotal(row.original);
          return (
            <span className="tabular-nums">{formatCurrency(svcTotal)}</span>
          );
        },
      },
      {
        id: "parts",
        accessorFn: (row) =>
          row.parts.reduce((s, x) => s + Number(x.final_price), 0),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={financeT("partsColumn")}
          />
        ),
        cell: ({ row }) => {
          const { prtTotal } = getGrandTotal(row.original);
          return (
            <span className="tabular-nums">{formatCurrency(prtTotal)}</span>
          );
        },
      },
      {
        id: "grand_total",
        accessorFn: (row) => {
          const svc = row.services.reduce(
            (s, x) => s + Number(x.final_price),
            0,
          );
          const prt = row.parts.reduce((s, x) => s + Number(x.final_price), 0);
          return svc + prt;
        },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={financeT("totalColumn")}
          />
        ),
        cell: ({ row }) => {
          const { grandTotal } = getGrandTotal(row.original);
          return (
            <span className="font-semibold tabular-nums">
              {formatCurrency(grandTotal)}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={financeT("dateColumn")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
    ],
    [search, financeT],
  );

  if (!hasAnyData) {
    return <EmptyFinanceState />;
  }

  const emptyMessage =
    filteredWorkOrders.length === 0 && search
      ? financeT("noWorkOrdersMatch")
      : !data?.recentWorkOrders || data.recentWorkOrders.length === 0
        ? financeT("noWorkOrdersInPeriod")
        : null;

  return (
    <>
      <ListToolbar
        search={{
          placeholder: financeT("searchTransactions"),
          value: search,
          onChange: onSearchChange,
          resultLabel: filteredWorkOrders.length
            ? financeT("resultsCount", { count: filteredWorkOrders.length })
            : undefined,
          emptyLabel: search
            ? financeT("noMatches", { query: search })
            : undefined,
        }}
        stats={
          <span>
            {financeT("workOrdersCount", { count: filteredWorkOrders.length })}
          </span>
        }
        actions={
          <ExportButton
            data={filteredWorkOrders}
            columns={exportColumns}
            filename={`transactions-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName={financeT("transactionsSheet")}
          />
        }
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {t("dashboard.recentWorkOrders")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredWorkOrders}
            getRowId={(row) => row.id}
            pageSize={20}
            emptyState={
              emptyMessage ? (
                <div className="px-5 py-16 text-center text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : undefined
            }
            renderMobileCard={(wo) => {
              const customerName =
                [wo.customer?.first_name, wo.customer?.last_name]
                  .filter(Boolean)
                  .join(" ") || "—";
              const vehicleDisplay = wo.vehicle?.plate_number || "—";
              const total =
                (wo.services ?? []).reduce(
                  (s, x) => s + Number(x.final_price),
                  0,
                ) +
                (wo.parts ?? []).reduce((s, x) => s + Number(x.final_price), 0);
              return (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{wo.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {wo.status || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium truncate">{customerName}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {vehicleDisplay}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-2">
                    <span className="text-xs text-muted-foreground">
                      {wo.created_at
                        ? new Date(wo.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
