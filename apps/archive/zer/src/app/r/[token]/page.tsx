import { capture } from "@zuiio/capture";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
import { formatDate } from "@/lib/format";
import { getFullReport } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

export default function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportDataFetcher params={params} />
    </Suspense>
  );
}

async function ReportDataFetcher({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  try {
    const { data: reportData, error: rpcError } = await supabase.rpc(
      "get_public_report_data",
      { p_token: token },
    );

    if (rpcError) {
      capture(rpcError, { context: "public report: RPC lookup" });
      notFound();
    }

    if (!reportData) {
      notFound();
    }

    const share = reportData as {
      organization_id: string;
      date_from: string;
      date_to: string;
    };

    const report = await getFullReport(
      supabase,
      share.organization_id,
      share.date_from,
      share.date_to,
    );
    const reportPeriod =
      share.date_from === share.date_to
        ? `${formatDate(share.date_from)} өдрийн тайлан.`
        : `${formatDate(share.date_from)} - ${formatDate(share.date_to)} хугацааны тайлан.`;

    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Тайлан</h1>
          <p className="text-sm text-muted-foreground">{reportPeriod}</p>
          <p className="text-sm text-muted-foreground">
            Хуваалцсан тайлан, санхүүгийн болон үйл ажиллагааны нэгдсэн тайлан.
          </p>
        </div>

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
      </div>
    );
  } catch (err) {
    capture(err, { context: "public report" });
    notFound();
  }
}

function ReportSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="rounded-xl border border-border/80 bg-card p-5 shadow-sm"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-muted mb-3" />
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
