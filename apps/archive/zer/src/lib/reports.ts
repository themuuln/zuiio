import type { SupabaseClient } from "@supabase/supabase-js";
import { withDbCapture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";

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

// ─── Financial Statement Types ──────────────────────────────────────

export type ProfitLossRow = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  amount: number;
};

export type ProfitLossData = {
  revenue: ProfitLossRow[];
  expenses: ProfitLossRow[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
};

export type BalanceSheetRow = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
};

export type BalanceSheetData = {
  assets: BalanceSheetRow[];
  liabilities: BalanceSheetRow[];
  equity: BalanceSheetRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
};

export type CashFlowRow = {
  category: string;
  amount: number;
};

export type CashFlowData = {
  operating: number;
  investing: number;
  financing: number;
  netCashFlow: number;
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
      withDbCapture(
        "report: financial summary sales",
        supabase
          .from("sales")
          .select("total_amount, paid_amount")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .gte("sale_date", dateFrom)
          .lte("sale_date", dateTo)
          .neq("status", "cancelled"),
      ),
      withDbCapture(
        "report: financial summary expenses",
        supabase
          .from("expenses")
          .select("amount")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .gte("expense_date", dateFrom)
          .lte("expense_date", dateTo),
      ),
      withDbCapture(
        "report: financial summary sale items",
        supabase
          .from("sale_items")
          .select(
            "quantity, products!inner(cost_price), sales!inner(organization_id, sale_date, status)",
          )
          .eq("sales.organization_id", organizationId)
          .is("deleted_at", null)
          .is("sales.deleted_at", null)
          .gte("sales.sale_date", dateFrom)
          .lte("sales.sale_date", dateTo)
          .neq("sales.status", "cancelled"),
      ),
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
  const { data: items } = await withDbCapture(
    "report: product sales breakdown",
    supabase
      .from("sale_items")
      .select(
        "quantity, total_price, products!inner(name, cost_price), sales!inner(organization_id, sale_date, status)",
      )
      .eq("sales.organization_id", organizationId)
      .is("deleted_at", null)
      .is("sales.deleted_at", null)
      .gte("sales.sale_date", dateFrom)
      .lte("sales.sale_date", dateTo)
      .neq("sales.status", "cancelled"),
  );

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
  const { data: expenses } = await withDbCapture(
    "report: expense breakdown by category",
    supabase
      .from("expenses")
      .select("category, amount")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .gte("expense_date", dateFrom)
      .lte("expense_date", dateTo),
  );

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
  const { data: movements } = await withDbCapture(
    "report: stock movements summary",
    supabase
      .from("stock_movements")
      .select("type")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),
  );

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
  const { data: sales } = await withDbCapture(
    "report: pending sales",
    supabase
      .from("sales")
      .select("id, total_amount, sale_date, payment_method, contacts(name)")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "pending")
      .gte("sale_date", dateFrom)
      .lte("sale_date", dateTo)
      .order("sale_date", { ascending: false }),
  );

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
  const { data: commissionItems } = await withDbCapture(
    "report: commission summary items",
    supabase
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
      .is("deleted_at", null)
      .is("sales.deleted_at", null)
      .gte("sales.sale_date", dateFrom)
      .lte("sales.sale_date", dateTo)
      .neq("sales.status", "cancelled")
      .not("sales.salesperson_id", "is", null)
      .gt("commission_amount", 0),
  );

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
    const entry = staffMap.get(staffId);
    if (entry) entry.earned += earned;
  }

  // Get per-staff paid amounts
  // Decompose the triple-join (commission_payout_items -> sale_items -> sales)
  // into two simpler queries for reliability.
  const staffPaidMap = new Map<string, number>();
  if (allItemIds.length > 0) {
    // Step 1: Fetch commission_payout_items directly (no joins needed)
    const { data: payoutItems } = await withDbCapture(
      "report: commission payout items",
      supabase
        .from("commission_payout_items")
        .select("sale_item_id, commission_amount")
        .in("sale_item_id", allItemIds),
    );

    // Step 2: Fetch sale_items joined with sales to get the salesperson_id mapping
    const { data: saleItemStaff } = await withDbCapture(
      "report: commission sale item staff",
      supabase
        .from("sale_items")
        .select("id, sales!inner(salesperson_id)")
        .in("id", allItemIds),
    );

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

// ─── Financial Statement Queries ────────────────────────────────────

/**
 * Returns profit & loss data for the given organization and date range.
 * Groups accounts by type (income/expense) and computes totals.
 */
export async function getProfitLoss(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
  branchId?: string | null,
): Promise<ProfitLossData> {
  const { data, error } = await withDbCapture(
    "report: profit_loss",
    supabase.rpc("get_profit_loss", {
      p_organization_id: organizationId,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_branch_id: branchId ?? undefined,
    }),
  );

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    account_id: string;
    account_code: string;
    account_name: string;
    account_type: string;
    amount: number;
  }>;

  const revenue = rows
    .filter((r) => r.account_type === "income")
    .map((r) => ({
      accountId: r.account_id,
      accountCode: r.account_code,
      accountName: r.account_name,
      accountType: r.account_type,
      amount: Number(r.amount),
    }));

  const expenses = rows
    .filter((r) => r.account_type === "expense")
    .map((r) => ({
      accountId: r.account_id,
      accountCode: r.account_code,
      accountName: r.account_name,
      accountType: r.account_type,
      amount: Number(r.amount),
    }));

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0);

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  };
}

/**
 * Returns balance sheet data as of a specific date.
 * Groups accounts by type (asset/liability/equity).
 */
export async function getBalanceSheetData(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  asOfDate: string,
  branchId?: string | null,
): Promise<BalanceSheetData> {
  const { data, error } = await withDbCapture(
    "report: balance_sheet",
    supabase.rpc("get_balance_sheet", {
      p_organization_id: organizationId,
      p_as_of_date: asOfDate,
      p_branch_id: branchId ?? undefined,
    }),
  );

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    account_id: string;
    account_code: string;
    account_name: string;
    account_type: string;
    balance: number;
  }>;

  const mapRow = (r: (typeof rows)[number]): BalanceSheetRow => ({
    accountId: r.account_id,
    accountCode: r.account_code,
    accountName: r.account_name,
    accountType: r.account_type,
    balance: Number(r.balance),
  });

  const assets = rows.filter((r) => r.account_type === "asset").map(mapRow);
  const liabilities = rows
    .filter((r) => r.account_type === "liability")
    .map(mapRow);
  const equity = rows.filter((r) => r.account_type === "equity").map(mapRow);

  return {
    assets,
    liabilities,
    equity,
    totalAssets: assets.reduce((sum, r) => sum + r.balance, 0),
    totalLiabilities: liabilities.reduce((sum, r) => sum + r.balance, 0),
    totalEquity: equity.reduce((sum, r) => sum + r.balance, 0),
  };
}

/**
 * Returns cash flow data for the given organization and date range.
 * Groups by category (operating/investing/financing).
 */
export async function getCashFlowData(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dateFrom: string,
  dateTo: string,
  branchId?: string | null,
): Promise<CashFlowData> {
  const { data, error } = await withDbCapture(
    "report: cash_flow",
    supabase.rpc("get_cash_flow", {
      p_organization_id: organizationId,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_branch_id: branchId ?? undefined,
    }),
  );

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    category: string;
    amount: number;
  }>;

  const operating = rows.find((r) => r.category === "operating")?.amount ?? 0;
  const investing = rows.find((r) => r.category === "investing")?.amount ?? 0;
  const financing = rows.find((r) => r.category === "financing")?.amount ?? 0;

  return {
    operating: Number(operating),
    investing: Number(investing),
    financing: Number(financing),
    netCashFlow: Number(operating) + Number(investing) + Number(financing),
  };
}
