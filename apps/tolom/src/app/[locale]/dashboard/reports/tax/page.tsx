"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { createOrgQuery } from "@/lib/queries/factory";
import { reportKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { formatCurrency } from "@/lib/utils";

interface TaxReportItem {
  id: string;
  type: "invoice" | "expense";
  date: string;
  reference: string;
  description: string;
  amountWithTax: number;
  taxAmount: number;
}

interface TaxReportSummary {
  totalSalesWithTax: number;
  totalTaxCollected: number;
  totalPurchasesWithTax: number;
  totalTaxPaid: number;
  netTaxPayable: number;
  invoiceCount: number;
  expenseCount: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export default function TaxReportPage() {
  const t = useTranslations("reports") as (key: string, values?: Record<string, string | number>) => string;
  const commonT = useTranslations("common") as (key: string, values?: Record<string, string | number>) => string;
  const _router = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? "";

  // Default to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(
    firstDay.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(lastDay.toISOString().split("T")[0]);

  const fetchTaxReport = createOrgQuery<{
    summary: TaxReportSummary;
    items: TaxReportItem[];
  }>("/reports/tax");

  const {
    data: report,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reportKeys.summary(orgId, "tax", `${startDate}_${endDate}`),
    queryFn: () =>
      fetchTaxReport(orgId, {
        params: { startDate, endDate },
      }),
    enabled: !!orgId && !!startDate && !!endDate,
    placeholderData: (previousData) => previousData,
  });

  const handleGenerate = () => {
    if (!orgId) return;
    if (!startDate || !endDate) {
      toast.error(t("selectDateRange"));
      return;
    }
    refetch();
  };

  const exportCSV = () => {
    if (!report) return;

    const headers = [
      "Type",
      "Date",
      "Reference",
      "Description",
      "Amount",
      "Tax",
    ];
    const rows = report.items.map((item) => [
      item.type,
      item.date,
      item.reference,
      item.description,
      item.amountWithTax,
      item.taxAmount,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/dashboard/reports" />}
        >
          <ArrowLeft className="size-4" />
          {commonT("back")}
        </Button>
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("taxReport")}
          </Typography.H1>
          <Typography.Muted className="text-sm">
            {t("taxReportDesc")}
          </Typography.Muted>
        </div>
      </div>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("reportPeriod")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t("startDate")}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t("endDate")}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? t("generating") : t("generateReport")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Typography.Text className="text-destructive">
              {error?.message ?? t("failedToLoad")}
            </Typography.Text>
            <Button variant="outline" onClick={() => refetch()}>
              {commonT("retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Summary */}
      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <Typography.Muted className="text-xs">
                  {t("totalSales")}
                </Typography.Muted>
                <Typography.Text className="text-lg font-semibold">
                  {formatCurrency(report.summary.totalSalesWithTax)}
                </Typography.Text>
                <Typography.Muted className="text-xs">
                  {report.summary.invoiceCount} {t("invoices")}
                </Typography.Muted>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Typography.Muted className="text-xs">
                  {t("vatCollected")}
                </Typography.Muted>
                <Typography.Text className="text-lg font-semibold text-primary">
                  {formatCurrency(report.summary.totalTaxCollected)}
                </Typography.Text>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Typography.Muted className="text-xs">
                  {t("totalPurchases")}
                </Typography.Muted>
                <Typography.Text className="text-lg font-semibold">
                  {formatCurrency(report.summary.totalPurchasesWithTax)}
                </Typography.Text>
                <Typography.Muted className="text-xs">
                  {report.summary.expenseCount} {t("expenses")}
                </Typography.Muted>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Typography.Muted className="text-xs">
                  {t("vatPaid")}
                </Typography.Muted>
                <Typography.Text className="text-lg font-semibold">
                  {formatCurrency(report.summary.totalTaxPaid)}
                </Typography.Text>
              </CardContent>
            </Card>
          </div>

          {/* Net НӨАТ */}
          <Card
            className={
              report.summary.netTaxPayable > 0
                ? "border-destructive/50"
                : "border-emerald-500/50"
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Muted className="text-xs">
                    {t("netVatPayable")}
                  </Typography.Muted>
                  <Typography.Text className="text-2xl font-bold">
                    {formatCurrency(report.summary.netTaxPayable)}
                  </Typography.Text>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="size-4" />
                    CSV
                  </Button>
                </div>
              </div>
              <Typography.Muted className="text-xs mt-2">
                {report.summary.netTaxPayable > 0
                  ? t("vatOwedToAuthority")
                  : t("vatRefundable")}
              </Typography.Muted>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("reportDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("type")}
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("date")}
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("reference")}
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("description")}
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        {t("amount")}
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        {t("vat")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.type === "invoice"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.type === "invoice"
                              ? t("sale")
                              : t("purchase")}
                          </span>
                        </td>
                        <td className="py-2">{item.date}</td>
                        <td className="py-2 font-mono text-xs">
                          {item.reference}
                        </td>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right font-mono">
                          {formatCurrency(item.amountWithTax)}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {formatCurrency(item.taxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!report && !isPending && !isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-12 text-muted-foreground/40 mb-4" />
            <Typography.Text className="text-muted-foreground">
              {t("selectPeriodToGenerate")}
            </Typography.Text>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
