import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { capture } from "@zuiio/capture";

// ─── Public Types ─────────────────────────────────────────────────────

export type FinancialSummary = {
  totalSales: number;
  totalPaid: number;
  totalExpenses: number;
  netCash: number;
  grossProfit: number;
};

export type ProductSalesRow = {
  productName: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
};

export type ExpenseCategoryRow = {
  category: string;
  count: number;
  total: number;
};

export type StockMovementsSummary = {
  in: number;
  out: number;
  adjustment: number;
};

export type PendingSaleRow = {
  id: string;
  contactName: string | null;
  saleDate: string;
  totalAmount: number;
  paymentMethod: string | null;
};

export type CommissionStaffRow = {
  staffName: string;
  staffId: string;
  earned: number;
  paid: number;
  unpaid: number;
};

export type CommissionSummaryData = {
  totalEarned: number;
  totalPaid: number;
  totalUnpaid: number;
  staffBreakdown: CommissionStaffRow[];
};

export type ReportData = {
  financialSummary: FinancialSummary;
  productSales: ProductSalesRow[];
  expenseBreakdown: ExpenseCategoryRow[];
  stockMovements: StockMovementsSummary;
  pendingSales: PendingSaleRow[];
  commissionSummary: CommissionSummaryData;
};

// ─── Internal helpers ─────────────────────────────────────────────────

type SaleItemForProductSales = {
  quantity: number;
  total_price: number;
  products: { name: string; cost_price: number | null } | null;
};

// ─── Query Functions ──────────────────────────────────────────────────

/**
 * Returns financial summary for the given organization and date range.
 */
export async function getFinancialSummary(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
): Promise<FinancialSummary> {
  const [{ data: sales }, { data: expenses }, { data: items }] =
    await Promise.all([
      supabase
        .from("sales")
        .select("total_amount, paid_amount")
        .eq("organization_id", organizationId)
        .gte("sale_date", dateFrom)
        .lte("sale_date", dateTo)
        .neq("status", "cancelled")
        .then((result) => {
          if (result.error) capture(result.error, { context: "[reports] getFinancialSummary sales" });
          return result;
        }),
      supabase
        .from("expenses")
        .select("amount")
        .eq("organization_id", organizationId)
        .gte("expense_date", dateFrom)
        .lte("expense_date", dateTo)
        .then((result) => {
          if (result.error) capture(result.error, { context: "[reports] getFinancialSummary expenses" });
          return result;
        }),
      supabase
        .from("sale_items")
        .select(
          "quantity, products!inner(cost_price), sales!inner(organization_id, sale_date, status)",
        )
        .eq("sales.organization_id", organizationId)
        .gte("sales.sale_date", dateFrom)
        .lte("sales.sale_date", dateTo)
        .neq("sales.status", "cancelled")
        .then((result) => {
          if (result.error) capture(result.error, { context: "[reports] getFinancialSummary sale_items" });
          return result;
        }),
    ]);

  const totalSales =
    sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;
  const totalPaid =
    sales?.reduce((sum, s) => sum + Number(s.paid_amount ?? 0), 0) ?? 0;
  const totalExpenses =
    expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  const costOfGoodsSold =
    items?.reduce((sum, item) => {
      const costPrice =
        (item.products as { cost_price: number | null } | null)?.cost_price ??
        0;
      return sum + Number(item.quantity) * Number(costPrice);
    }, 0) ?? 0;

  return {
    totalSales,
    totalPaid,
    totalExpenses,
    netCash: totalPaid - totalExpenses,
    grossProfit: totalSales - costOfGoodsSold,
  };
}

/**
 * Returns per-product sales breakdown for the given organization and date range.
 */
export async function getProductSalesBreakdown(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ProductSalesRow[]> {
  const { data: items, error } = await supabase
    .from("sale_items")
    .select(
      "quantity, total_price, products!inner(name, cost_price), sales!inner(organization_id, sale_date, status)",
    )
    .eq("sales.organization_id", organizationId)
    .gte("sales.sale_date", dateFrom)
    .lte("sales.sale_date", dateTo)
    .neq("sales.status", "cancelled");
  if (error) capture(error, { context: "[reports] getProductSalesBreakdown items" });

  const rawItems = (items ?? []) as unknown as SaleItemForProductSales[];

  // Aggregate by product name
  const productMap = new Map<string, ProductSalesRow>();

  for (const item of rawItems) {
    const productName = item.products?.name ?? "Unknown";
    const costPrice = item.products?.cost_price ?? 0;
    const quantity = Number(item.quantity);
    const revenue = Number(item.total_price);
    const cost = quantity * Number(costPrice);

    const existing = productMap.get(productName);
    if (existing) {
      existing.quantity += quantity;
      existing.revenue += revenue;
      existing.cost += cost;
    } else {
      productMap.set(productName, {
        productName,
        quantity,
        revenue,
        cost,
        profit: 0,
        margin: 0,
      });
    }
  }

  // Calculate profit and margin, then sort by revenue descending
  const result = [...productMap.values()].map((row) => {
    const profit = row.revenue - row.cost;
    const margin = row.revenue > 0 ? (profit / row.revenue) * 100 : 0;
    return { ...row, profit, margin };
  });

  result.sort((a, b) => b.revenue - a.revenue);

  return result;
}

/**
 * Returns expense breakdown grouped by category for the given organization and date range.
 */
export async function getExpenseBreakdownByCategory(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ExpenseCategoryRow[]> {
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("category, amount")
    .eq("organization_id", organizationId)
    .gte("expense_date", dateFrom)
    .lte("expense_date", dateTo);
  if (error) capture(error, { context: "[reports] getExpenseBreakdownByCategory expenses" });

  const raw = expenses ?? [];
  const categoryMap = new Map<string, { count: number; total: number }>();

  for (const expense of raw) {
    const cat = expense.category;
    const existing = categoryMap.get(cat);
    if (existing) {
      existing.count += 1;
      existing.total += Number(expense.amount);
    } else {
      categoryMap.set(cat, { count: 1, total: Number(expense.amount) });
    }
  }

  const result: ExpenseCategoryRow[] = [...categoryMap.entries()].map(
    ([category, { count, total }]) => ({ category, count, total }),
  );

  result.sort((a, b) => b.total - a.total);

  return result;
}

/**
 * Returns stock movements summary (in/out/adjustment counts) for the given organization and date range.
 */
export async function getStockMovementsSummary(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
): Promise<StockMovementsSummary> {
  const { data: movements, error } = await supabase
    .from("stock_movements")
    .select("type")
    .eq("organization_id", organizationId)
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo);
  if (error) capture(error, { context: "[reports] getStockMovementsSummary movements" });

  const raw = movements ?? [];
  const summary: StockMovementsSummary = { in: 0, out: 0, adjustment: 0 };

  for (const movement of raw) {
    if (movement.type === "in") summary.in += 1;
    else if (movement.type === "out") summary.out += 1;
    else if (movement.type === "adjustment") summary.adjustment += 1;
  }

  return summary;
}

/**
 * Returns pending sales with contact info for the given organization and date range.
 */
export async function getPendingSales(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
): Promise<PendingSaleRow[]> {
  const { data: sales, error } = await supabase
    .from("sales")
    .select("id, total_amount, sale_date, payment_method, contacts(name)")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .gte("sale_date", dateFrom)
    .lte("sale_date", dateTo)
    .order("sale_date", { ascending: false });
  if (error) capture(error, { context: "[reports] getPendingSales sales" });

  const raw = sales ?? [];

  return raw.map((sale) => ({
    id: sale.id,
    contactName: (sale.contacts as { name: string } | null)?.name ?? null,
    saleDate: sale.sale_date,
    totalAmount: Number(sale.total_amount),
    paymentMethod: sale.payment_method,
  }));
}

/**
 * Returns commission summary (earned/paid/unpaid) with per-staff breakdown
 * for the given organization and date range. Excludes cancelled sales and
 * sales with null salesperson_id.
 */
export async function getCommissionSummaryReport(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
): Promise<CommissionSummaryData> {
  // Fetch all sale_items with commission_amount > 0 from non-cancelled sales
  // in the date range that have a salesperson assigned
  const { data: commissionItems, error } = await supabase
    .from("sale_items")
    .select(
      `id,
       commission_amount,
       sales!inner(
         salesperson_id,
         profiles!sales_salesperson_id_fkey(full_name),
         sale_date,
         status,
         organization_id
       )`,
    )
    .eq("sales.organization_id", organizationId)
    .gte("sales.sale_date", dateFrom)
    .lte("sales.sale_date", dateTo)
    .neq("sales.status", "cancelled")
    .not("sales.salesperson_id", "is", null)
    .gt("commission_amount", 0);
  if (error) capture(error, { context: "[reports] getCommissionSummaryReport commissionItems" });

  if (!commissionItems || commissionItems.length === 0) {
    return { totalEarned: 0, totalPaid: 0, totalUnpaid: 0, staffBreakdown: [] };
  }

  // Build per-staff aggregation and collect sale_item IDs
  const allItemIds: string[] = [];
  const staffMap = new Map<
    string,
    { fullName: string; saleItemIds: string[]; earned: number }
  >();

  for (const item of commissionItems as unknown as Array<{
    id: string;
    commission_amount: number;
    sales: {
      salesperson_id: string;
      profiles: { full_name: string | null } | null;
    };
  }>) {
    const staffId = item.sales.salesperson_id;
    const fullName = item.sales.profiles?.full_name ?? "Unknown";
    const earned = Number(item.commission_amount);

    allItemIds.push(item.id);

    if (!staffMap.has(staffId)) {
      staffMap.set(staffId, { fullName, saleItemIds: [], earned: 0 });
    }
    const entry = staffMap.get(staffId)!;
    entry.earned += earned;
  }

  // Get per-staff paid amounts
  // Decompose the triple-join (commission_payout_items -> sale_items -> sales)
  // into two simpler queries for reliability.
  const staffPaidMap = new Map<string, number>();
  if (allItemIds.length > 0) {
    // Step 1: Fetch commission_payout_items directly (no joins needed)
    const { data: payoutItems, error: payoutError } = await supabase
      .from("commission_payout_items")
      .select("sale_item_id, commission_amount")
      .in("sale_item_id", allItemIds);
    if (payoutError) capture(payoutError, { context: "[reports] getCommissionSummaryReport payoutItems" });

    // Step 2: Fetch sale_items joined with sales to get the salesperson_id mapping
    const { data: saleItemStaff, error: staffError } = await supabase
      .from("sale_items")
      .select("id, sales!inner(salesperson_id)")
      .in("id", allItemIds);
    if (staffError) capture(staffError, { context: "[reports] getCommissionSummaryReport saleItemStaff" });

    if (payoutItems && saleItemStaff) {
      // Build sale_item_id -> salesperson_id mapping
      const itemIdToStaffId = new Map<string, string>();
      for (const si of saleItemStaff) {
        const sale = si.sales as { salesperson_id: string };
        itemIdToStaffId.set(si.id, sale.salesperson_id);
      }

      // Aggregate paid amounts by staff
      for (const pi of payoutItems) {
        const staffId = itemIdToStaffId.get(pi.sale_item_id);
        if (staffId) {
          const amount = Number(pi.commission_amount);
          staffPaidMap.set(staffId, (staffPaidMap.get(staffId) ?? 0) + amount);
        }
      }
    }
  }

  let totalEarned = 0;
  let totalPaid = 0;
  const staffBreakdown: CommissionStaffRow[] = [];

  for (const [staffId, data] of staffMap.entries()) {
    const paid = staffPaidMap.get(staffId) ?? 0;
    const unpaid = Math.max(0, data.earned - paid);
    totalEarned += data.earned;
    totalPaid += paid;

    staffBreakdown.push({
      staffName: data.fullName,
      staffId,
      earned: data.earned,
      paid,
      unpaid,
    });
  }

  // Sort by earned descending
  staffBreakdown.sort((a, b) => b.earned - a.earned);

  return {
    totalEarned,
    totalPaid,
    totalUnpaid: Math.max(0, totalEarned - totalPaid),
    staffBreakdown,
  };
}

/**
 * Fetches all report sections in parallel and returns a single ReportData object.
 */
export async function getFullReport(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ReportData> {
  const [
    financialSummary,
    productSales,
    expenseBreakdown,
    stockMovements,
    pendingSales,
    commissionSummary,
  ] = await Promise.all([
    getFinancialSummary(supabase, organizationId, dateFrom, dateTo),
    getProductSalesBreakdown(supabase, organizationId, dateFrom, dateTo),
    getExpenseBreakdownByCategory(supabase, organizationId, dateFrom, dateTo),
    getStockMovementsSummary(supabase, organizationId, dateFrom, dateTo),
    getPendingSales(supabase, organizationId, dateFrom, dateTo),
    getCommissionSummaryReport(supabase, organizationId, dateFrom, dateTo),
  ]);

  return {
    financialSummary,
    productSales,
    expenseBreakdown,
    stockMovements,
    pendingSales,
    commissionSummary,
  };
}
