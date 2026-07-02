import { notFound } from "next/navigation";
import { ExpenseBreakdown } from "@/components/reports/expense-breakdown";
import { ExpenseDonutChart } from "@/components/reports/expense-donut-chart";
import { FinancialSummary } from "@/components/reports/financial-summary";
import { FinancialSummaryChart } from "@/components/reports/financial-summary-chart";
import { PendingSales } from "@/components/reports/pending-sales";
import { PendingSalesChart } from "@/components/reports/pending-sales-chart";
import { ProductMarginChart } from "@/components/reports/product-margin-chart";
import { ProductRevenueChart } from "@/components/reports/product-revenue-chart";
import { ProductSalesTable } from "@/components/reports/product-sales-table";
import { StockMovementChart } from "@/components/reports/stock-movement-chart";
import { StockMovements } from "@/components/reports/stock-movements";
import { formatDate } from "@/lib/format";
import { getFullReport } from "@/lib/reports";
import { createServiceClient } from "@/lib/supabase/server-service";

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: share, error: lookupError } = await supabase
    .from("shared_reports")
    .select("organization_id, date_from, date_to")
    .eq("token", token)
    .single();

  if (lookupError || !share) {
    console.error("Public report error: token not found", lookupError);
    notFound();
  }

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
}
