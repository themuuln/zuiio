import { addDays, startOfDay, subDays } from "date-fns";

import { requireAppContext } from "@/lib/erp";
import type { DashboardData } from "./dashboard-client";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { supabase, organizationId } = await requireAppContext();

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const thirtyDaysAgo = subDays(today, 30);

  // Run all queries in parallel
  const [
    productsResult,
    customersResult,
    suppliersResult,
    salesTodayResult,
    expensesTodayResult,
    lowStockProducts,
    pendingSalesResult,
    recentSalesResult,
    inventoryProducts,
    monthlySalesResult,
  ] = await Promise.all([
    // 1. Total products
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),

    // 2. Total customers
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("type", "customer"),

    // 3. Total suppliers
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("type", "supplier"),

    // 4. Today's sales
    supabase
      .from("sales")
      .select("total_amount")
      .eq("organization_id", organizationId)
      .gte("sale_date", today.toISOString())
      .lt("sale_date", tomorrow.toISOString()),

    // 5. Today's expenses
    supabase
      .from("expenses")
      .select("amount")
      .eq("organization_id", organizationId)
      .gte("expense_date", today.toISOString())
      .lt("expense_date", tomorrow.toISOString()),

    // 6. Low stock products (fetch all to compare column-to-column)
    supabase
      .from("products")
      .select("current_stock, min_stock")
      .eq("organization_id", organizationId),

    // 7. Pending sales
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),

    // 8. Recent 5 sales
    supabase
      .from("sales")
      .select("id, total_amount, sale_date, status, contacts(name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5),

    // 9. Inventory value
    supabase
      .from("products")
      .select("cost_price, current_stock")
      .eq("organization_id", organizationId),

    // 10. Monthly trend
    supabase
      .from("sales")
      .select("total_amount, sale_date")
      .eq("organization_id", organizationId)
      .gte("sale_date", thirtyDaysAgo.toISOString())
      .lt("sale_date", tomorrow.toISOString()),
  ]);

  // Compute KPIs
  const totalProducts = productsResult.count ?? 0;
  const totalCustomers = customersResult.count ?? 0;
  const totalSuppliers = suppliersResult.count ?? 0;

  const todaySalesTotal = (salesTodayResult.data ?? []).reduce(
    (sum, sale) => sum + (sale.total_amount ?? 0),
    0,
  );

  const todayExpensesTotal = (expensesTodayResult.data ?? []).reduce(
    (sum, exp) => sum + (exp.amount ?? 0),
    0,
  );

  const lowStockCount = (lowStockProducts.data ?? []).filter((product) => {
    const currentStock = product.current_stock ?? 0;
    const minStock = product.min_stock ?? 0;
    return currentStock < minStock;
  }).length;

  const pendingSalesCount = pendingSalesResult.count ?? 0;

  const recentSales = (recentSalesResult.data ?? []).map((sale) => ({
    id: sale.id,
    sale_date: sale.sale_date,
    contact_name: (sale.contacts as { name: string } | null)?.name ?? null,
    total_amount: sale.total_amount,
    status: sale.status,
  }));

  const inventoryValue = (inventoryProducts.data ?? []).reduce(
    (sum, product) =>
      sum + (product.cost_price ?? 0) * (product.current_stock ?? 0),
    0,
  );

  // Aggregate monthly trend by day
  const trendMap = new Map<string, number>();
  for (const sale of monthlySalesResult.data ?? []) {
    const day = sale.sale_date.slice(0, 10); // YYYY-MM-DD
    trendMap.set(day, (trendMap.get(day) ?? 0) + (sale.total_amount ?? 0));
  }
  const monthlyTrend: DashboardData["monthlyTrend"] = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const key = date.toISOString().slice(0, 10);
    monthlyTrend.push({
      date: key,
      total: trendMap.get(key) ?? 0,
    });
  }

  const dashboardData: DashboardData = {
    todaySalesTotal,
    todayExpensesTotal,
    totalProducts,
    totalCustomers,
    totalSuppliers,
    lowStockCount,
    pendingSalesCount,
    inventoryValue,
    recentSales,
    monthlyTrend,
  };

  return <DashboardClient data={dashboardData} />;
}
