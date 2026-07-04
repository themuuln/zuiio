import { supabase } from "@/lib/supabase/client";

export interface DashboardKpis {
  todaySalesCount: number;
  todaySalesTotal: number;
  productCount: number;
  customerCount: number;
  supplierCount: number;
  lowStockCount: number;
}

export async function fetchDashboardKpis(
  organizationId: string,
  branchId?: string | null,
): Promise<DashboardKpis> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayIso = todayStart.toISOString();

  const baseQuery = supabase
    .from("sales")
    .select("id, total_amount", { count: "exact" })
    .eq("organization_id", organizationId)
    .gte("created_at", todayIso);

  if (branchId) {
    baseQuery.eq("branch_id", branchId);
  }

  const [salesRes, productsRes, customersRes, suppliersRes, lowStockRes] =
    await Promise.all([
      baseQuery,
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null),
      supabase
        .from("suppliers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .lt("current_stock", 1)
        .limit(1),
    ]);

  const todaySales = salesRes.data ?? [];
  const todaySalesTotal = todaySales.reduce(
    (sum, s) => sum + (s.total_amount ?? 0),
    0,
  );

  return {
    todaySalesCount: salesRes.count ?? 0,
    todaySalesTotal,
    productCount: productsRes.count ?? 0,
    customerCount: customersRes.count ?? 0,
    supplierCount: suppliersRes.count ?? 0,
    lowStockCount: lowStockRes.count ?? 0,
  };
}
