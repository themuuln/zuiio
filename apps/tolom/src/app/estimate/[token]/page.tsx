"use client";

import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Phone,
  Printer,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { usePublicEstimate } from "@/lib/queries/use-estimates";
import { formatCurrency } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { icon: typeof Clock; className: string }> =
  {
    draft: {
      icon: Clock,
      className: "bg-muted text-foreground",
    },
    sent: {
      icon: FileText,
      className: "bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
    },
    approved: {
      icon: CheckCircle2,
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
    declined: {
      icon: XCircle,
      className:
        "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive",
    },
    expired: {
      icon: Clock,
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    },
    converted: {
      icon: CheckCircle2,
      className:
        "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300",
    },
  };

export default function PublicEstimatePage() {
  const t = useTranslations("estimates") as (key: string, values?: Record<string, string | number>) => string;
  const commonT = useTranslations("common") as (key: string, values?: Record<string, string | number>) => string;
  const params = useParams();
  const token = params.token as string;
  const estimateQuery = usePublicEstimate(token);
  const estimate = estimateQuery.data;

  if (estimateQuery.isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <Skeleton className="h-16 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-[420px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-muted/20 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-xl">
          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardContent className="py-12 text-center">
              <XCircle className="mx-auto mb-4 size-10 text-muted-foreground" />
              <Typography.H3>{t("publicUnavailableTitle")}</Typography.H3>
              <Typography.Muted className="mt-2">
                {estimateQuery.error instanceof Error
                  ? estimateQuery.error.message
                  : t("publicUnavailableDescription")}
              </Typography.Muted>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[estimate.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = status.icon;
  const customerName =
    [estimate.customer?.first_name, estimate.customer?.last_name]
      .filter(Boolean)
      .join(" ") || "—";

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-6 print:bg-white md:px-6 md:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 print:max-w-none">
        <div className="rounded-3xl border border-border/60 bg-background p-4 shadow-sm print:hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Typography.Text className="text-sm font-medium">
                {estimate.organization?.name ?? "TOLOM"}
              </Typography.Text>
              <Typography.Muted className="mt-1">
                {t("publicPageSubtitle")}
              </Typography.Muted>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LocaleSwitcher />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                {commonT("print")}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  window.open(`/api/estimate/public/${token}/pdf`, "_blank")
                }
              >
                <Download className="size-4" />
                {t("downloadPdf")}
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-3xl border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={status.className}>
                    <StatusIcon className="size-3.5" />
                    {t(`status_${estimate.status}`)}
                  </Badge>
                  {estimate.valid_until ? (
                    <Badge variant="outline">
                      {t("validUntil")}:{" "}
                      {new Date(estimate.valid_until).toLocaleDateString()}
                    </Badge>
                  ) : null}
                </div>
                <div>
                  <Typography.H1 className="text-3xl font-semibold tracking-tight">
                    {estimate.estimate_number}
                  </Typography.H1>
                  <Typography.Muted className="mt-1">
                    {t("created")}{" "}
                    {new Date(estimate.created_at).toLocaleDateString()}
                  </Typography.Muted>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 md:min-w-56">
                <Typography.Text className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("grandTotal")}
                </Typography.Text>
                <Typography.Text className="mt-1 block font-mono text-2xl font-semibold">
                  {formatCurrency(Number(estimate.grand_total ?? 0))}
                </Typography.Text>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-2xl border-border/60 shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("customerInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Typography.Text className="font-medium">
                    {customerName}
                  </Typography.Text>
                  {estimate.customer?.phone ? (
                    <Typography.Muted>
                      {estimate.customer.phone}
                    </Typography.Muted>
                  ) : null}
                  {estimate.customer?.email ? (
                    <Typography.Muted>
                      {estimate.customer.email}
                    </Typography.Muted>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("vehicleInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Typography.Text className="font-medium font-mono">
                    {estimate.vehicle?.plate_number ?? "—"}
                  </Typography.Text>
                  <Typography.Muted>
                    {[
                      estimate.vehicle?.year,
                      estimate.vehicle?.make,
                      estimate.vehicle?.model,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </Typography.Muted>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("lineItems")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {estimate.items.map((item, index) => (
              <div
                key={`${item.description}-${index}`}
                className="rounded-2xl border border-border/60 bg-card p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      <Badge variant="outline">{t(item.item_type)}</Badge>
                    </div>
                    <Typography.Text className="font-medium">
                      {item.description}
                    </Typography.Text>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                      <span>
                        {t("qty")}: {item.quantity}
                      </span>
                      <span>
                        {t("unitPrice")}:{" "}
                        {formatCurrency(Number(item.unit_price ?? 0))}
                      </span>
                      <span>
                        {t("discount")}:{" "}
                        {Number(item.discount_amount ?? 0) > 0
                          ? formatCurrency(Number(item.discount_amount ?? 0))
                          : Number(item.discount_percentage ?? 0) > 0
                            ? `${item.discount_percentage}%`
                            : "—"}
                      </span>
                    </div>
                  </div>
                  <Typography.Text className="font-mono text-lg font-semibold">
                    {formatCurrency(Number(item.line_total ?? 0))}
                  </Typography.Text>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("quoteDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Typography.Text className="text-sm font-medium">
                  {t("notes")}
                </Typography.Text>
                <div className="mt-2 min-h-28 rounded-xl border border-border/60 px-3 py-2 text-sm">
                  {estimate.notes || "—"}
                </div>
              </div>
              <div>
                <Typography.Text className="text-sm font-medium">
                  {t("terms")}
                </Typography.Text>
                <div className="mt-2 min-h-28 rounded-xl border border-border/60 px-3 py-2 text-sm">
                  {estimate.terms || "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-mono">
                  {formatCurrency(Number(estimate.subtotal ?? 0))}
                </span>
              </div>
              {Number(estimate.discount_total ?? 0) > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("discount")}</span>
                  <span className="font-mono text-destructive">
                    -{formatCurrency(Number(estimate.discount_total ?? 0))}
                  </span>
                </div>
              ) : null}
              {Number(estimate.tax_total ?? 0) > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("tax")}</span>
                  <span className="font-mono">
                    {formatCurrency(Number(estimate.tax_total ?? 0))}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t pt-3">
                <Typography.Text className="font-medium">
                  {t("grandTotal")}
                </Typography.Text>
                <Typography.Text className="font-mono text-xl font-semibold">
                  {formatCurrency(Number(estimate.grand_total ?? 0))}
                </Typography.Text>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{commonT("contact")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <Typography.Text className="font-medium">
                  {commonT("phone")}
                </Typography.Text>
              </div>
              <Typography.Muted className="mt-2">
                {estimate.organization?.phone || "—"}
              </Typography.Muted>
            </div>
            <div className="rounded-2xl border border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <Typography.Text className="font-medium">
                  {commonT("email")}
                </Typography.Text>
              </div>
              <Typography.Muted className="mt-2">
                {estimate.organization?.email || "—"}
              </Typography.Muted>
            </div>
            <div className="rounded-2xl border border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <Typography.Text className="font-medium">
                  {commonT("address")}
                </Typography.Text>
              </div>
              <Typography.Muted className="mt-2">
                {estimate.organization?.address || "—"}
              </Typography.Muted>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
