import { requireAppContext } from "@/lib/erp";
import { SalesPageClient } from "./sales-page-client";

export default async function SalesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const [salesResult, productsResult, customersResult] = await Promise.all([
    supabase
      .from("sales")
      .select(
        `id, sale_date, total_amount, paid_amount, payment_method, status, notes,
         contacts(name),
         sale_items(id, quantity, unit_price, total_price, product:products(id, name, unit))`,
      )
      .eq("organization_id", organizationId)
      .order("sale_date", { ascending: false })
      .limit(50),
    supabase
      .from("products")
      .select("id, name, sale_price, current_stock, unit")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("contacts")
      .select("id, name, phone")
      .eq("organization_id", organizationId)
      .eq("type", "customer")
      .order("name"),
  ]);

  const sales = salesResult.data ?? [];
  const products = productsResult.data ?? [];
  const customers = customersResult.data ?? [];

  const completedAmount = sales.reduce(
    (sum, sale) => sum + Number(sale.total_amount ?? 0),
    0,
  );
  const pendingCount = sales.filter((sale) => sale.status === "pending").length;
  const invoiceCount = sales.filter(
    (sale) => sale.payment_method === "invoice",
  ).length;

  return (
    <SalesPageClient
      sales={sales}
      products={products}
      customers={customers}
      completedAmount={completedAmount}
      pendingCount={pendingCount}
      invoiceCount={invoiceCount}
    />
  );
}
