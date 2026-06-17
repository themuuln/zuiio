import { requireAppContext } from "@/lib/erp";
import { PurchasesContent } from "./purchases-content";
import type { PurchaseRow } from "./purchases-table";

export default async function PurchasesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const [ordersResult, suppliersResult, productsResult] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select(
        "id, order_number, order_date, expected_date, status, total_amount, notes, created_at, contacts!purchase_orders_supplier_id_fkey(name), profiles!purchase_orders_created_by_fkey(name)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("id, name, phone")
      .eq("organization_id", organizationId)
      .eq("type", "supplier")
      .order("name"),
    supabase
      .from("products")
      .select("id, name, cost_price, sale_price, current_stock, unit")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);

  const purchaseOrders: PurchaseRow[] =
    (ordersResult.data ?? []).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      order_date: order.order_date,
      expected_date: order.expected_date,
      status: order.status,
      total_amount: order.total_amount,
      notes: order.notes,
      created_at: order.created_at,
      supplier_name:
        (order.contacts as { name: string } | null)?.name ?? null,
      created_by_name:
        (order.profiles as { name: string } | null)?.name ?? null,
    })) ?? [];

  return (
    <PurchasesContent
      purchaseOrders={purchaseOrders}
      suppliers={suppliersResult.data ?? []}
      products={productsResult.data ?? []}
    />
  );
}
