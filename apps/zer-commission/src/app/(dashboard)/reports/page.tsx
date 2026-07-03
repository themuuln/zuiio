import { PageShell } from "@/components/erp/page-shell";
import { CommissionSummary } from "@/components/reports/commission-summary";
import { ExpenseBreakdown } from "@/components/reports/expense-breakdown";
import { FinancialSummary } from "@/components/reports/financial-summary";
import { PendingSales } from "@/components/reports/pending-sales";
import { ProductSalesTable } from "@/components/reports/product-sales-table";
import { StockMovements } from "@/components/reports/stock-movements";
import { requireAppContext } from "@/lib/erp";
import { formatRouteDate } from "@/lib/format";
import { getFullReport } from "@/lib/reports";
import { DateRangeForm } from "./date-range-form";
import { ShareDialog } from "./share-dialog";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { supabase, organizationId } = await requireAppContext();
  const params = await searchParams;

  // Parse and validate date params, defaulting to today
  const today = formatRouteDate();
  const rawFrom = params.from ?? today;
  const rawTo = params.to ?? today;

  const from = isValidDate(rawFrom) ? rawFrom : today;
  const to = isValidDate(rawTo) ? rawTo : today;

  const report = await getFullReport(supabase, organizationId, from, to);

  return (
    <PageShell
      title="Тайлан"
      description={`${from} - ${to} өдрийн санхүүгийн болон үйл ажиллагааны нэгдсэн тайлан.`}
      actions={<ShareDialog dateFrom={from} dateTo={to} />}
    >
      <DateRangeForm />

      <FinancialSummary data={report.financialSummary} />

      <ProductSalesTable data={report.productSales} />

      <ExpenseBreakdown data={report.expenseBreakdown} />

      <StockMovements data={report.stockMovements} />

      <PendingSales data={report.pendingSales} />

      <CommissionSummary data={report.commissionSummary} />
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
