"use client";

import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import type { ExportColumn } from "@/lib/export";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InvoiceItem, InvoicePayment } from "@/lib/types";
import type { InvoiceWithItems } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

// ── Invoice status badge ─────────────────────────────────

const invoiceStatusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 border-gray-300",
    icon: Clock,
  },
  sent: {
    label: "Sent",
    className: "bg-blue-100 text-blue-700 border-blue-300",
    icon: FileText,
  },
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partial Payment",
    className: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Clock,
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-700 border-red-300",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-500 border-gray-300",
    icon: XCircle,
  },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const config =
    invoiceStatusConfig[status] ?? invoiceStatusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className="gap-1.5 text-sm font-semibold min-h-[32px]">
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  );
}

// ── Format date ──────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Loading skeleton ─────────────────────────────────────

function InvoiceSkeleton() {
  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-8 flex justify-between">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Card>
        <CardContent className="p-8">
          <div className="mb-8 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
          <div className="mb-8 grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={`skeleton-${i}`} className="h-12 w-full" />
            ))}
          </div>
          <div className="mt-6 flex flex-col items-end gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-48" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────

function InvoiceError({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center p-8">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-5 py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20">
            <XCircle className="size-8 text-red-400" />
          </div>
          <div className="text-center">
            <Typography.H2 className="text-lg font-semibold">Invoice Not Found</Typography.H2>
            <Typography.Muted className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {message ||
                "This invoice could not be found. The link may be invalid or the invoice has been removed."}
            </Typography.Muted>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;

  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [orgName, setOrgName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoice/public/${token}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error.message ?? "Invoice not found");
      } else {
        setInvoice(json.data);
        // Try to fetch org name from the invoice's org
        if (json.data?.organization_name) {
          setOrgName(json.data.organization_name);
        }
      }
    } catch {
      setError("Failed to load invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePrint = () => {
    window.print();
  };

  // All hooks must be called before early returns (Rules of Hooks)
  const items = (invoice?.items ?? []);
  const payments = (invoice?.payments ?? []);

  const invoiceItemColumns: ExportColumn<InvoiceItem>[] = useMemo(
    () => [
      { key: "item_type", label: "Type" },
      { key: "description", label: "Description" },
      { key: "quantity", label: "Qty" },
      { key: "unit_price", label: "Unit Price", format: "currency" },
      { key: "discount_amount", label: "Discount", format: "currency" },
      { key: "total_price", label: "Total", format: "currency" },
    ],
    [],
  );

  const paymentColumns: ExportColumn<InvoicePayment>[] = useMemo(
    () => [
      { key: "paid_at", label: "Date", format: "date" },
      { key: "method", label: "Method" },
      { key: "reference", label: "Reference" },
      { key: "amount", label: "Amount", format: "currency" },
    ],
    [],
  );

  const servicesTotal = items
    .filter((i) => i.item_type === "service")
    .reduce((sum, i) => sum + Number(i.total_price), 0);
  const partsTotal = items
    .filter((i) => i.item_type === "part")
    .reduce((sum, i) => sum + Number(i.total_price), 0);

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return <InvoiceSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────
  if (error || !invoice) {
    return <InvoiceError message={error ?? "Invoice not found"} />;
  }

  return (
    <div className="min-h-dvh bg-gray-50/50 dark:bg-gray-950/50 print:bg-white">
      {/* ── Action bar (hidden when printing) ── */}
      <div className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur-sm dark:bg-gray-950/80 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              T
            </span>
            <span className="text-sm font-semibold">TOLOM</span>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              data={items}
              columns={invoiceItemColumns}
              filename={`invoice-${invoice.invoice_number}-items.xlsx`}
              sheetName="Line Items"
              label="Items"
            />
            {payments.length > 0 && (
              <ExportButton
                data={payments}
                columns={paymentColumns}
                filename={`invoice-${invoice.invoice_number}-payments.xlsx`}
                sheetName="Payments"
                label="Payments"
              />
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="size-4" />
              <span className="hidden sm:inline ml-1">Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handlePrint();
              }}
            >
              <Download className="size-4" />
              <span className="hidden sm:inline ml-1">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Invoice content ── */}
      <div className="mx-auto max-w-4xl p-4 md:p-8 print:p-0">
        <Card className="print:border-none print:shadow-none">
          <CardContent className="p-6 md:p-10 print:p-0">
            {/* Header */}
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Typography.H1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {orgName || "INVOICE"}
                </Typography.H1>
                <Typography.Muted className="mt-1.5 text-sm text-muted-foreground">
                  Invoice #{invoice.invoice_number}
                </Typography.Muted>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Issued: {formatDate(invoice.issued_at)}</span>
                  {invoice.due_at && (
                    <span>Due: {formatDate(invoice.due_at)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>

            {/* Billing info */}
            <div className="mb-10 grid gap-6 sm:grid-cols-2">
              <div>
                <Typography.H3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bill To
                </Typography.H3>
                <div className="flex flex-col gap-0.5 text-sm">
                  {invoice.customer_name && (
                    <Typography.Text className="font-medium">{invoice.customer_name}</Typography.Text>
                  )}
                  {invoice.customer_phone && (
                    <Typography.Muted className="text-muted-foreground">
                      {invoice.customer_phone}
                    </Typography.Muted>
                  )}
                  {invoice.customer_email && (
                    <Typography.Muted className="text-muted-foreground">
                      {invoice.customer_email}
                    </Typography.Muted>
                  )}
                  {invoice.customer_address && (
                    <Typography.Muted className="text-muted-foreground">
                      {invoice.customer_address}
                    </Typography.Muted>
                  )}
                  {!invoice.customer_name &&
                    !invoice.customer_phone &&
                    !invoice.customer_email && (
                      <Typography.Muted className="text-muted-foreground italic">
                        No customer info
                      </Typography.Muted>
                    )}
                </div>
              </div>
              <div>
                <Typography.H3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vehicle
                </Typography.H3>
                <div className="flex flex-col gap-0.5 text-sm">
                  {invoice.vehicle_plate && (
                    <Typography.Text className="font-mono font-medium">
                      {invoice.vehicle_plate}
                    </Typography.Text>
                  )}
                  {invoice.vehicle_details && (
                    <Typography.Muted className="text-muted-foreground">
                      {invoice.vehicle_details}
                    </Typography.Muted>
                  )}
                  {!invoice.vehicle_plate && !invoice.vehicle_details && (
                    <Typography.Muted className="text-muted-foreground italic">
                      No vehicle info
                    </Typography.Muted>
                  )}
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="mb-8 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="pb-3 text-left font-semibold text-muted-foreground">
                      Item
                    </TableHead>
                    <TableHead className="pb-3 text-right font-semibold text-muted-foreground">
                      Qty
                    </TableHead>
                    <TableHead className="pb-3 text-right font-semibold text-muted-foreground">
                      Unit Price
                    </TableHead>
                    <TableHead className="pb-3 text-right font-semibold text-muted-foreground">
                      Discount
                    </TableHead>
                    <TableHead className="pb-3 text-right font-semibold text-muted-foreground">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No line items on this invoice
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                              {item.item_type === "service" ? "SVC" : "PRT"}
                            </Badge>
                            <span className="font-medium">
                              {item.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums">
                          {formatCurrency(Number(item.unit_price))}
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums text-muted-foreground">
                          {Number(item.discount_amount) > 0
                            ? `-${formatCurrency(Number(item.discount_amount))}`
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="py-3 text-right font-semibold tabular-nums">
                          {formatCurrency(Number(item.total_price))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Category subtotals */}
            {(servicesTotal > 0 || partsTotal > 0) && (
              <div className="mb-6 flex flex-col gap-2 text-sm">
                {servicesTotal > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Services Total</span>
                    <span className="tabular-nums font-medium">
                      {formatCurrency(servicesTotal)}
                    </span>
                  </div>
                )}
                {partsTotal > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Parts Total</span>
                    <span className="tabular-nums font-medium">
                      {formatCurrency(partsTotal)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="flex flex-col items-end gap-1.5 border-t border-border pt-4">
              <div className="flex w-full max-w-xs items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums font-medium">
                  {formatCurrency(Number(invoice.subtotal))}
                </span>
              </div>
              {Number(invoice.discount_total) > 0 && (
                <div className="flex w-full max-w-xs items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums font-medium text-destructive">
                    -{formatCurrency(Number(invoice.discount_total))}
                  </span>
                </div>
              )}
              <div className="flex w-full max-w-xs items-center justify-between border-t border-border pt-2 text-lg font-semibold">
                <span>Grand Total</span>
                <span className="tabular-nums">
                  {formatCurrency(Number(invoice.total))}
                </span>
              </div>
              {Number(invoice.amount_paid) > 0 && (
                <>
                  <div className="flex w-full max-w-xs items-center justify-between text-sm text-green-600">
                    <span>Amount Paid</span>
                    <span className="tabular-nums font-medium">
                      -{formatCurrency(Number(invoice.amount_paid))}
                    </span>
                  </div>
                  <div className="flex w-full max-w-xs items-center justify-between border-t border-border pt-1 text-base font-semibold">
                    <span>Balance Due</span>
                    <span className="tabular-nums">
                      {formatCurrency(Number(invoice.balance_due))}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Payment history */}
            {payments.length > 0 && (
              <div className="mt-10">
                <Typography.H3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment History
                </Typography.H3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border">
                        <TableHead className="pb-2 pr-4 text-left font-medium text-muted-foreground">
                          Date
                        </TableHead>
                        <TableHead className="pb-2 pr-4 text-left font-medium text-muted-foreground">
                          Method
                        </TableHead>
                        <TableHead className="pb-2 pr-4 text-left font-medium text-muted-foreground">
                          Reference
                        </TableHead>
                        <TableHead className="pb-2 text-right font-medium text-muted-foreground">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow
                          key={p.id}
                          className="border-b border-border/50"
                        >
                          <TableCell className="py-2 pr-4 text-muted-foreground">
                            {formatDate(p.paid_at)}
                          </TableCell>
                          <TableCell className="py-2 pr-4 capitalize">
                            {p.method}
                          </TableCell>
                          <TableCell className="py-2 pr-4 text-muted-foreground">
                            {p.reference || "\u2014"}
                          </TableCell>
                          <TableCell className="py-2 text-right font-medium tabular-nums text-green-600">
                            {formatCurrency(Number(p.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Notes & Terms */}
            <div className="mt-10 grid gap-6 text-sm sm:grid-cols-2">
              {invoice.notes && (
                <div>
                  <Typography.H3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </Typography.H3>
                  <Typography.Muted className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {invoice.notes}
                  </Typography.Muted>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <Typography.H3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Terms
                  </Typography.H3>
                  <Typography.Muted className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {invoice.terms}
                  </Typography.Muted>
                </div>
              )}
            </div>

            {/* Footer */}
            {invoice.footer && (
              <div className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                {invoice.footer}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── CSS for print ─────────────────────────────── */}
      <style>{`
        @media print {
          @page {
            margin: 15mm;
            size: A4 portrait;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          /* Keep table row background colors */
          tr {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Keep badge colors */
          span {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Ensure tables break nicely */
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </div>
  );
}
