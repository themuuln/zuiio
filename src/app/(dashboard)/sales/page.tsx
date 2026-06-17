import { requireAppContext } from "@/lib/erp";
import type { SaleRow } from "./sales-table";
import { SalesContent } from "./sales-content";

export const unstable_instant = { prefetch: "static" };

export default async function SalesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const [salesResult, productsResult, customersResult] = await Promise.all([
    supabase
      .from("sales")
      .select(
        "id, total_amount, paid_amount, sale_date, status, payment_method, contacts(name)",
      )
      .eq("organization_id", organizationId)
      .order("sale_date", { ascending: false }),
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

  const sales: SaleRow[] =
    (salesResult.data ?? []).map((sale) => ({
      id: sale.id,
      sale_date: sale.sale_date,
      contact_name: (sale.contacts as { name: string } | null)?.name ?? null,
      total_amount: sale.total_amount,
      paid_amount: sale.paid_amount,
      status: sale.status,
      payment_method: sale.payment_method,
    })) ?? [];

  return (
    <SalesContent
      sales={sales}
      products={productsResult.data ?? []}
      customers={customersResult.data ?? []}
    />
  );
}
