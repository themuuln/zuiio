/**
 * Tax report service for НӨАТ (VAT) reporting.
 *
 * Generates tax summaries for filing with the General Taxation Authority.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────────

export interface TaxReportPeriod {
  startDate: string;
  endDate: string;
}

export interface TaxReportSummary {
  // Sales (НӨАТ-тэй борлуулалт)
  totalSalesWithTax: number;
  totalTaxCollected: number;

  // Purchases (НӨАТ-тэй худалдан авалт) - from expenses
  totalPurchasesWithTax: number;
  totalTaxPaid: number;

  // Net НӨАТ
  netTaxPayable: number;

  // Item counts
  invoiceCount: number;
  expenseCount: number;

  // Period
  period: TaxReportPeriod;
}

export interface TaxReportItem {
  id: string;
  type: "invoice" | "expense";
  date: string;
  reference: string;
  description: string;
  amountWithTax: number;
  taxAmount: number;
}

// ── Get Tax Report ───────────────────────────────────────────

/**
 * Generates a tax report for a given period.
 *
 * @param db - Supabase client
 * @param orgId - Organization ID
 * @param period - Start and end dates
 * @returns Tax report summary and items
 */
export async function getTaxReport(
  db: SupabaseClient,
  orgId: string,
  period: TaxReportPeriod,
): Promise<{ summary: TaxReportSummary; items: TaxReportItem[] }> {
  const { startDate, endDate } = period;

  // Fetch invoices with tax in the period
  const { data: invoices } = await db
    .from("invoices")
    .select("id, invoice_number, total, tax_total, issued_at, status")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .gte("issued_at", startDate)
    .lte("issued_at", endDate)
    .not("status", "eq", "cancelled");

  // Fetch expenses with tax in the period
  const { data: expenses } = await db
    .from("expenses")
    .select("id, description, amount, tax_amount, expense_date, vendor_name")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .gte("expense_date", startDate)
    .lte("expense_date", endDate);

  // Calculate sales totals
  const invoiceItems: TaxReportItem[] = (invoices ?? []).map((inv) => ({
    id: inv.id,
    type: "invoice" as const,
    date: inv.issued_at,
    reference: inv.invoice_number,
    description: `Invoice #${inv.invoice_number}`,
    amountWithTax: Number(inv.total),
    taxAmount: Number(inv.tax_total),
  }));

  const totalSalesWithTax = invoiceItems.reduce(
    (sum, item) => sum + item.amountWithTax,
    0,
  );
  const totalTaxCollected = invoiceItems.reduce(
    (sum, item) => sum + item.taxAmount,
    0,
  );

  // Calculate purchase totals
  const expenseItems: TaxReportItem[] = (expenses ?? []).map((exp) => ({
    id: exp.id,
    type: "expense" as const,
    date: exp.expense_date,
    reference: exp.vendor_name ?? "Expense",
    description: exp.description,
    amountWithTax: Number(exp.amount) + Number(exp.tax_amount),
    taxAmount: Number(exp.tax_amount),
  }));

  const totalPurchasesWithTax = expenseItems.reduce(
    (sum, item) => sum + item.amountWithTax,
    0,
  );
  const totalTaxPaid = expenseItems.reduce(
    (sum, item) => sum + item.taxAmount,
    0,
  );

  // Net НӨАТ (collected - paid)
  const netTaxPayable = totalTaxCollected - totalTaxPaid;

  const summary: TaxReportSummary = {
    totalSalesWithTax,
    totalTaxCollected,
    totalPurchasesWithTax,
    totalTaxPaid,
    netTaxPayable,
    invoiceCount: invoiceItems.length,
    expenseCount: expenseItems.length,
    period,
  };

  // Combine and sort by date
  const items = [...invoiceItems, ...expenseItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return { summary, items };
}

// ── Format Tax Report ────────────────────────────────────────

/**
 * Formats a tax report as a text summary for display.
 */
export function formatTaxReport(
  summary: TaxReportSummary,
  locale: string = "mn",
): string {
  const isMn = locale === "mn";
  const currency = (amount: number) =>
    `₮${amount.toLocaleString("mn-MN")}`;

  if (isMn) {
    return `НӨАТ Тайлан: ${summary.period.startDate} — ${summary.period.endDate}

Борлуулалт (НӨАТ-тэй):
├── Нийт борлуулалт: ${currency(summary.totalSalesWithTax)}
├── НӨАТ цуглурсан: ${currency(summary.totalTaxCollected)}
└── Нэхэмжлэлийн тоо: ${summary.invoiceCount}

Худалдан авалт (НӨАТ-тэй):
├── Нийт худалдан авалт: ${currency(summary.totalPurchasesWithTax)}
├── НӨАТ төлсөн: ${currency(summary.totalTaxPaid)}
└── Зардлын тоо: ${summary.expenseCount}

НӨАТ төлбөр: ${currency(summary.netTaxPayable)}`;
  }

  return `VAT Report: ${summary.period.startDate} — ${summary.period.endDate}

Sales (with VAT):
├── Total sales: ${currency(summary.totalSalesWithTax)}
├── VAT collected: ${currency(summary.totalTaxCollected)}
└── Invoice count: ${summary.invoiceCount}

Purchases (with VAT):
├── Total purchases: ${currency(summary.totalPurchasesWithTax)}
├── VAT paid: ${currency(summary.totalTaxPaid)}
└── Expense count: ${summary.expenseCount}

Net VAT payable: ${currency(summary.netTaxPayable)}`;
}
