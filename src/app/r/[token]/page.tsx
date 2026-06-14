import { notFound } from "next/navigation";
import { ExpenseBreakdown } from "@/components/reports/expense-breakdown";
import { FinancialSummary } from "@/components/reports/financial-summary";
import { PendingSales } from "@/components/reports/pending-sales";
import { ProductSalesTable } from "@/components/reports/product-sales-table";
import { StockMovements } from "@/components/reports/stock-movements";
import type { ReportData } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Call the SECURITY DEFINER function to get full report data via RPC
  // This bypasses RLS for anon users, no service role key needed
  const { data: reportData, error } = await supabase.rpc(
    "get_public_report_data",
    { p_token: token },
  );

  if (error || !reportData) {
    console.error("Public report error:", error ?? "Token not found");
    notFound();
  }

  const report = reportData as unknown as ReportData;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Тайлан</h1>
        <p className="text-sm text-muted-foreground">
          Хуваалцсан тайлан - өдрийн санхүүгийн болон үйл ажиллагааны нэгдсэн
          тайлан.
        </p>
      </div>

      <FinancialSummary data={report.financialSummary} />
      <ProductSalesTable data={report.productSales} />
      <ExpenseBreakdown data={report.expenseBreakdown} />
      <StockMovements data={report.stockMovements} />
      <PendingSales data={report.pendingSales} />
    </div>
  );
}
