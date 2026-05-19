"use client";

import { useClientNow } from "@/hooks/use-client-now";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExportColumn } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";
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

export function TransactionsTab({
  hasAnyData,
  search,
  onSearchChange,
  filteredWorkOrders,
  data,
}: TransactionsTabProps) {
  const now = useClientNow();
  if (!hasAnyData) {
    return <EmptyFinanceState />;
  }

  const exportColumns: ExportColumn<WorkOrderRow>[] = [
    { key: "id", label: "WO #", value: (wo) => wo.id.slice(0, 8) },
    {
      key: "customer",
      label: "Customer",
      value: (wo) => {
        const c = wo.customer;
        return c ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() : "—";
      },
    },
    {
      key: "vehicle",
      label: "Vehicle",
      value: (wo) => wo.vehicle?.plate_number ?? "—",
    },
    { key: "status", label: "Status" },
    {
      key: "services",
      label: "Services",
      format: "currency",
      value: (wo) => {
        return wo.services.reduce((s, x) => s + Number(x.final_price), 0);
      },
    },
    {
      key: "parts",
      label: "Parts",
      format: "currency",
      value: (wo) => {
        return wo.parts.reduce((s, x) => s + Number(x.final_price), 0);
      },
    },
    {
      key: "grand_total",
      label: "Total",
      format: "currency",
      value: (wo) => {
        return (
          wo.services.reduce((s, x) => s + Number(x.final_price), 0) +
          wo.parts.reduce((s, x) => s + Number(x.final_price), 0)
        );
      },
    },
    { key: "created_at", label: "Date", format: "date" },
  ];

  return (
    <>
      <ListToolbar
        search={{
          placeholder: "Search by customer, plate, or ID...",
          value: search,
          onChange: onSearchChange,
        }}
        stats={
          <span>
            {filteredWorkOrders.length} work order
            {filteredWorkOrders.length !== 1 ? "s" : ""}
          </span>
        }
        actions={
          <ExportButton
            data={filteredWorkOrders}
            columns={exportColumns}
            filename={`transactions-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName="Transactions"
          />
        }
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Recent Work Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Customer
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Vehicle
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    Services
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    Parts
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    Total
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkOrders.length === 0 && search ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="px-5 py-16 text-center text-muted-foreground"
                    >
                      No work orders match your search
                    </TableCell>
                  </TableRow>
                ) : (
                  (!data?.recentWorkOrders ||
                    data.recentWorkOrders.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="px-5 py-16 text-center text-muted-foreground"
                      >
                        No work orders in this period
                      </TableCell>
                    </TableRow>
                  )
                )}
                {filteredWorkOrders.map((wo) => {
                  const svcTotal = (
                    wo.services as Array<{ final_price: number }>
                  ).reduce(
                    (sum: number, s: { final_price: number }) =>
                      sum + Number(s.final_price),
                    0,
                  );
                  const prtTotal = (
                    wo.parts as Array<{ final_price: number }>
                  ).reduce(
                    (sum: number, p: { final_price: number }) =>
                      sum + Number(p.final_price),
                    0,
                  );
                  const grandTotal = svcTotal + prtTotal;

                  return (
                    <TableRow
                      key={wo.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-3.5 font-mono text-xs">
                        {wo.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        {wo.customer
                          ? `${wo.customer.first_name} ${wo.customer.last_name ?? ""}`.trim()
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-muted-foreground">
                        {wo.vehicle?.plate_number ?? "\u2014"}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${wo.status === "Completed" ? "#22c55e" : wo.status === "Cancelled" ? "#ef4444" : wo.status === "In Progress" ? "#f97316" : wo.status === "Diagnosing" ? "#eab308" : wo.status === "New" ? "#3b82f6" : "#6b7280"}20`,
                            color:
                              wo.status === "Completed"
                                ? "#22c55e"
                                : wo.status === "Cancelled"
                                  ? "#ef4444"
                                  : wo.status === "In Progress"
                                    ? "#f97316"
                                    : wo.status === "Diagnosing"
                                      ? "#eab308"
                                      : wo.status === "New"
                                        ? "#3b82f6"
                                        : "#6b7280",
                          }}
                        >
                          {wo.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right tabular-nums">
                        {formatCurrency(svcTotal)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right tabular-nums">
                        {formatCurrency(prtTotal)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right font-semibold tabular-nums">
                        {formatCurrency(grandTotal)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right text-muted-foreground">
                        {formatDate(wo.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
