"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  History,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  PageErrorState,
  PageNotFoundState,
  PageShellSkeleton,
} from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { cn, formatMNT } from "@/lib/utils";

const STATUS_STYLES: Record<string, { dot: string; bg: string }> = {
  Completed: { dot: "bg-gray-400", bg: "bg-gray-50" },
  "In Progress": { dot: "bg-amber-500 animate-pulse", bg: "bg-amber-50" },
  Diagnosing: { dot: "bg-yellow-500", bg: "bg-yellow-50" },
  New: { dot: "bg-blue-500", bg: "bg-blue-50" },
  "Ready for Pickup": { dot: "bg-green-500 animate-pulse", bg: "bg-green-50" },
  Cancelled: { dot: "bg-red-400", bg: "bg-red-50" },
};

interface WorkOrderService {
  id: number;
  service_name: string;
  description: string | null;
  unit_price: number;
  quantity: number;
  final_price: number;
  notes: string | null;
}

interface WorkOrderPart {
  id: number;
  part_name: string;
  part_number: string | null;
  quantity: number;
  unit_price: number;
  final_price: number;
  notes: string | null;
}

interface StatusHistoryEntry {
  id: number;
  previous_status: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  subtotal: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  issued_at: string;
  due_at: string;
  public_token?: string;
  items: InvoiceItem[];
}

interface WorkOrderDetail {
  id: number;
  vehicle_id: number;
  status: string;
  description: string | null;
  complaint: string | null;
  diagnosis: string | null;
  subtotal: number;
  discount_total: number;
  total: number;
  odometer_at_service: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  services: WorkOrderService[];
  parts: WorkOrderPart[];
  status_history: StatusHistoryEntry[];
  invoices: Invoice[];
}

const INVOICE_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "default",
  sent: "secondary",
  overdue: "destructive",
  draft: "outline",
  partial: "secondary",
  cancelled: "outline",
};

export default function PortalWorkOrderDetailPage() {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const params = useParams();
  const workOrderId = params.id as string;
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["portal", "work-order", workOrderId],
    queryFn: async () => {
      const res = await fetch(`/api/portal/work-orders/${workOrderId}`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(t("portal.failedToLoadWorkOrder"));
      }
      const json = await res.json();
      return json.data as WorkOrderDetail;
    },
    enabled: !!customer && !!workOrderId,
  });

  // Subscribe to real-time work order status changes
  useRealtime({
    table: "work_orders",
    queryKey: ["portal", "work-order", workOrderId],
    filter: `id=eq.${workOrderId}`,
    enabled: !!customer && !!workOrderId,
  });

  if (authLoading || isLoading) {
    return <PageShellSkeleton cards={2} title={t("portal.workOrders")} />;
  }

  if (error) {
    return (
      <PageErrorState
        description={error.message}
        onRetry={() => refetch()}
        className="min-h-[260px]"
      />
    );
  }

  if (!data) {
    return <PageNotFoundState description={t("portal.workOrderNotFound")} />;
  }

  const style = STATUS_STYLES[data.status] ?? STATUS_STYLES.Completed;

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href={`/portal/vehicles/${data.vehicle_id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      {/* Work order header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Wrench className="size-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Typography.H1 className="text-xl font-semibold">
                  {data.description ?? data.complaint ?? "Work Order"}
                </Typography.H1>
                <Badge
                  variant="secondary"
                  className={cn("text-[11px]", style.bg)}
                >
                  <span
                    className={cn(
                      "mr-1 inline-block size-1.5 rounded-full",
                      style.dot,
                    )}
                  />
                  {data.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground/70">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(data.created_at).toLocaleDateString()}
                </span>
                {data.odometer_at_service != null && (
                  <span>{data.odometer_at_service.toLocaleString()} km</span>
                )}
                {data.started_at && (
                  <span>
                    Started: {new Date(data.started_at).toLocaleDateString()}
                  </span>
                )}
                {data.completed_at && (
                  <span>
                    Completed:{" "}
                    {new Date(data.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Typography.Text className="text-lg font-bold tabular-nums">
                {formatMNT(Number(data.total))}
              </Typography.Text>
              <Typography.Muted className="text-[10px] text-muted-foreground/60">
                Total
              </Typography.Muted>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint & diagnosis */}
      {(data.complaint || data.diagnosis) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" />
              {t("workOrders.complaintAndNotes") ?? "Complaint & Diagnosis"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {data.complaint && (
              <div>
                <Typography.Muted className="text-xs font-medium text-muted-foreground mb-0.5">
                  {t("workOrders.complaint") ?? "Complaint"}
                </Typography.Muted>
                <Typography.Text>{data.complaint}</Typography.Text>
              </div>
            )}
            {data.diagnosis && (
              <div>
                <Typography.Muted className="text-xs font-medium text-muted-foreground mb-0.5">
                  {t("workOrders.diagnosis") ?? "Diagnosis"}
                </Typography.Muted>
                <Typography.Text>{data.diagnosis}</Typography.Text>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Services table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="size-4 text-muted-foreground" />
            {t("workOrders.services") ?? "Services"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.services.length === 0 ? (
            <Typography.Muted className="text-sm text-muted-foreground py-4 text-center">
              No services added.
            </Typography.Muted>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground/70">
                    <th className="pb-2 font-medium">
                      {t("common.description") ?? "Service"}
                    </th>
                    <th className="pb-2 font-medium text-right">
                      {t("common.quantity") ?? "Qty"}
                    </th>
                    <th className="pb-2 font-medium text-right">
                      {t("common.unitPrice") ?? "Unit Price"}
                    </th>
                    <th className="pb-2 font-medium text-right">
                      {t("common.total") ?? "Total"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.services.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <Typography.Text className="font-medium">
                          {s.service_name}
                        </Typography.Text>
                        {s.notes && (
                          <Typography.Muted className="text-xs text-muted-foreground/60 mt-0.5">
                            {s.notes}
                          </Typography.Muted>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {s.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {formatMNT(Number(s.unit_price))}
                      </td>
                      <td className="py-2.5 pl-2 text-right tabular-nums font-semibold">
                        {formatMNT(Number(s.final_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parts table */}
      {data.parts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="size-4 text-muted-foreground" />
              {t("workOrders.parts") ?? "Parts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground/70">
                    <th className="pb-2 font-medium">
                      {t("common.description") ?? "Part"}
                    </th>
                    <th className="pb-2 font-medium">
                      {t("common.unitPrice") ?? "Part #"}
                    </th>
                    <th className="pb-2 font-medium text-right">
                      {t("common.quantity") ?? "Qty"}
                    </th>
                    <th className="pb-2 font-medium text-right">
                      {t("common.unitPrice") ?? "Unit Price"}
                    </th>
                    <th className="pb-2 font-medium text-right">
                      {t("common.total") ?? "Total"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.parts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <Typography.Text className="font-medium">
                          {p.part_name}
                        </Typography.Text>
                        {p.notes && (
                          <Typography.Muted className="text-xs text-muted-foreground/60 mt-0.5">
                            {p.notes}
                          </Typography.Muted>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground/70">
                        {p.part_number ?? "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {p.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {formatMNT(Number(p.unit_price))}
                      </td>
                      <td className="py-2.5 pl-2 text-right tabular-nums font-semibold">
                        {formatMNT(Number(p.final_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status history timeline */}
      {data.status_history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              {t("workOrders.statusTimeline") ?? "Status Timeline"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-0">
              {data.status_history.map((entry, idx) => {
                const entryStyle =
                  STATUS_STYLES[entry.status] ?? STATUS_STYLES.Completed;
                const isLast = idx === data.status_history.length - 1;
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "size-2.5 rounded-full ring-2 ring-background shrink-0 mt-1.5",
                          entryStyle.dot.replace("animate-pulse", ""),
                        )}
                      />
                      {!isLast && (
                        <div className="w-px flex-1 bg-border/60 my-0.5" />
                      )}
                    </div>
                    <div
                      className={cn("pb-4 min-w-0 flex-1", isLast && "pb-0")}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {entry.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      {entry.notes && (
                        <Typography.Muted className="text-xs text-muted-foreground/70 mt-0.5">
                          {entry.notes}
                        </Typography.Muted>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {data.invoices.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" />
              {t("portal.invoices") ?? "Invoices"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {data.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3.5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        #{inv.invoice_number}
                      </span>
                      <Badge
                        variant={
                          INVOICE_STATUS_VARIANTS[inv.status] ?? "outline"
                        }
                        className="text-[10px]"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <Typography.Muted className="text-xs text-muted-foreground/60 mt-0.5">
                      {inv.issued_at
                        ? new Date(inv.issued_at).toLocaleDateString()
                        : ""}
                      {inv.due_at
                        ? ` · Due: ${new Date(inv.due_at).toLocaleDateString()}`
                        : ""}
                    </Typography.Muted>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMNT(Number(inv.total))}
                    </span>
                    {inv.public_token && (
                      <a
                        href={`/invoice/${inv.public_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="text-xs">
                          View
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
