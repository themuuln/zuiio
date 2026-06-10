"use client";

import { CheckCircle2, Clock, Download, FileText, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
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
import { Typography } from "@/components/ui/typography";
import { formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

interface PublicEstimate {
  id: string;
  estimate_number: string;
  status: string;
  created_at: string;
  valid_until: string | null;
  notes: string | null;
  terms: string | null;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  customer: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  vehicle: {
    plate_number: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
  } | null;
  items: {
    description: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    discount_percentage: number;
    line_total: number;
  }[];
  organization: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
}

// ── Status config ──────────────────────────────────────────────

const statusConfig: Record<
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
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    className: "bg-red-100 text-red-700 border-red-300",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    className: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Clock,
  },
  converted: {
    label: "Converted",
    className: "bg-purple-100 text-purple-700 border-purple-300",
    icon: CheckCircle2,
  },
};

// ── Component ──────────────────────────────────────────────────

export default function PublicEstimatePage() {
  const t = useTranslations();
  const params = useParams();
  const token = params.token as string;
  const [estimate, setEstimate] = useState<PublicEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/estimate/public/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Estimate not found");
        return r.json();
      })
      .then((json) => {
        setEstimate(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <XCircle className="size-10 text-muted-foreground" />
            <Typography.H3>{error ?? "Estimate not found"}</Typography.H3>
            <Typography.Muted>
              This estimate may have been removed or the link is invalid.
            </Typography.Muted>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[estimate.status] ?? statusConfig.draft;
  const StatusIcon = status.icon;
  const customerName = [
    estimate.customer?.first_name,
    estimate.customer?.last_name,
  ]
    .filter(Boolean)
    .join(" ");
  const vehicleDisplay = estimate.vehicle
    ? [estimate.vehicle.year, estimate.vehicle.make, estimate.vehicle.model]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="bg-background border-b px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">
          {estimate.organization?.name ?? "TOLOM"}
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print
          </Button>
          <Button
            size="sm"
            onClick={() =>
              window.open(`/api/estimate/public/${token}/pdf`, "_blank")
            }
          >
            <Download className="size-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Typography.H2 className="text-2xl">
              {estimate.estimate_number}
            </Typography.H2>
            <Typography.Muted>
              Created {new Date(estimate.created_at).toLocaleDateString()}
              {estimate.valid_until &&
                ` · Valid until ${new Date(estimate.valid_until).toLocaleDateString()}`}
            </Typography.Muted>
          </div>
          <Badge variant="outline" className={`gap-1.5 ${status.className}`}>
            <StatusIcon className="size-3" />
            {status.label}
          </Badge>
        </div>

        {/* Customer & Vehicle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <Typography.Muted className="text-xs mb-1">
                {t("common.customer")}
              </Typography.Muted>
              <Typography.Text className="font-medium">
                {customerName || "—"}
              </Typography.Text>
              {estimate.customer?.phone && (
                <Typography.Muted className="text-sm block">
                  {estimate.customer.phone}
                </Typography.Muted>
              )}
              {estimate.customer?.email && (
                <Typography.Muted className="text-sm block">
                  {estimate.customer.email}
                </Typography.Muted>
              )}
            </CardContent>
          </Card>
          {estimate.vehicle && (
            <Card>
              <CardContent className="pt-4">
                <Typography.Muted className="text-xs mb-1">
                  {t("common.vehicle")}
                </Typography.Muted>
                <Typography.Text className="font-medium font-mono">
                  {estimate.vehicle.plate_number}
                </Typography.Text>
                {vehicleDisplay && (
                  <Typography.Muted className="text-sm block">
                    {vehicleDisplay}
                  </Typography.Muted>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Items */}
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>{t("estimates.description")}</TableHead>
                  <TableHead className="text-right w-16">
                    {t("estimates.qty")}
                  </TableHead>
                  <TableHead className="text-right w-24">
                    {t("estimates.unitPrice")}
                  </TableHead>
                  <TableHead className="text-right w-20">
                    {t("estimates.discount")}
                  </TableHead>
                  <TableHead className="text-right w-24">
                    {t("estimates.total")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimate.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <span>{item.description}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 ml-2"
                      >
                        {item.item_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {item.discount_amount > 0
                        ? formatCurrency(item.discount_amount)
                        : item.discount_percentage > 0
                          ? `${item.discount_percentage}%`
                          : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-sm">
                      {formatCurrency(item.line_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2 ml-auto max-w-xs">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("estimates.subtotal")}
                </span>
                <span className="font-mono">
                  {formatCurrency(estimate.subtotal)}
                </span>
              </div>
              {estimate.discount_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("estimates.discount")}
                  </span>
                  <span className="font-mono text-destructive">
                    -{formatCurrency(estimate.discount_total)}
                  </span>
                </div>
              )}
              {estimate.tax_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("estimates.tax")}
                  </span>
                  <span className="font-mono">
                    {formatCurrency(estimate.tax_total)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>{t("estimates.grandTotal")}</span>
                <span className="font-mono">
                  {formatCurrency(estimate.grand_total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Terms */}
        {(estimate.notes || estimate.terms) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estimate.notes && (
              <Card>
                <CardContent className="pt-4">
                  <Typography.Muted className="text-xs mb-1">
                    {t("estimates.notes")}
                  </Typography.Muted>
                  <Typography.Text className="text-sm whitespace-pre-wrap">
                    {estimate.notes}
                  </Typography.Text>
                </CardContent>
              </Card>
            )}
            {estimate.terms && (
              <Card>
                <CardContent className="pt-4">
                  <Typography.Muted className="text-xs mb-1">
                    {t("estimates.terms")}
                  </Typography.Muted>
                  <Typography.Text className="text-sm whitespace-pre-wrap">
                    {estimate.terms}
                  </Typography.Text>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          {estimate.organization?.name ?? "TOLOM"}
          {estimate.organization?.phone && ` · ${estimate.organization.phone}`}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .max-w-3xl, .max-w-3xl * { visibility: visible; }
          .max-w-3xl { position: absolute; left: 0; top: 0; width: 100%; }
          .bg-muted\\/30 { background: white !important; }
        }
      `}</style>
    </div>
  );
}
