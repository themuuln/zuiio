import { Suspense } from "react";

import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { CommissionSummary } from "@/components/reports/commission-summary";
import { ExpenseBreakdown } from "@/components/reports/expense-breakdown";
import { FinancialSummary } from "@/components/reports/financial-summary";
import { PendingSales } from "@/components/reports/pending-sales";
import { ProductSalesTable } from "@/components/reports/product-sales-table";
import {
  ExpenseDonutChart,
  FinancialSummaryChart,
  PendingSalesChart,
  ProductMarginChart,
  ProductRevenueChart,
  StockMovementChart,
} from "@/components/reports/report-charts-dynamic";
import { StockMovements } from "@/components/reports/stock-movements";
import { requireAppContext } from "@/lib/erp";
import { formatRouteDate } from "@/lib/format";
import { getFullReport } from "@/lib/reports";
import { DateRangeForm } from "./date-range-form";
import { ShareDialog } from "./share-dialog";

async function DataFetcher({ from, to }: { from: string; to: string }) {
  const { supabase, organizationId } = await requireAppContext();
  const report = await getFullReport(supabase, organizationId, from, to);

  return (
    <>
      <FinancialSummary data={report.financialSummary} />

      <FinancialSummaryChart data={report.financialSummary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProductSalesTable data={report.productSales} />
        <ProductRevenueChart data={report.productSales} />
      </div>

      <ProductMarginChart data={report.productSales} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseBreakdown data={report.expenseBreakdown} />
        <ExpenseDonutChart data={report.expenseBreakdown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StockMovements data={report.stockMovements} />
        <StockMovementChart data={report.stockMovements} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingSales data={report.pendingSales} />
        <PendingSalesChart data={report.pendingSales} />
      </div>

      <CommissionSummary data={report.commissionSummary} />
    </>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  // Parse and validate date params, defaulting to today
  const today = formatRouteDate();
  const rawFrom = params.from ?? today;
  const rawTo = params.to ?? today;

  const from = isValidDate(rawFrom) ? rawFrom : today;
  const to = isValidDate(rawTo) ? rawTo : today;

  return (
    <PageShell
      title="Тайлан"
      description={`${from} - ${to} өдрийн санхүүгийн болон үйл ажиллагааны нэгдсэн тайлан.`}
      actions={
        <>
          <ExportButton
            href={`/api/export/reports?from=${from}&to=${to}`}
            filename={`report-${from}-to-${to}`}
          />
          <ShareDialog dateFrom={from} dateTo={to} />
        </>
      }
    >
      <DateRangeForm />
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}
      >
        <DataFetcher from={from} to={to} />
      </Suspense>
    </PageShell>
  );
}

function isValidDate(value: string): boolean {
  // Accept YYYY-MM-DD format only
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  // Ensure the date string matches the parsed date to avoid
  // dates like "2026-02-30" being silently accepted
  const [y, m, d] = value.split("-").map(Number);
  return (
    date.getFullYear() === y &&
    date.getMonth() + 1 === m &&
    date.getDate() === d
  );
}
