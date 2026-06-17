import { requireAppContext } from "@/lib/erp";
import { ReturnsContent } from "./returns-content";

export type ReturnRow = {
  id: string;
  return_number: string;
  return_date: string;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  contact_name: string | null;
  status: string;
  total_amount: number;
  reason: string | null;
};

export default async function ReturnsPage() {
  const { supabase, organizationId } = await requireAppContext();

  const [
    returnsResult,
    contactsResult,
    productsResult,
    salesResult,
    purchaseOrdersResult,
  ] = await Promise.all([
    supabase
      .from("returns")
      .select(
        "id, return_number, return_date, type, reference_type, reference_id, contact_id, status, total_amount, reason, contacts(name)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("products")
      .select("id, name, sale_price, current_stock, unit")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("sales")
      .select("id, sale_date, total_amount, contacts(name)")
      .eq("organization_id", organizationId)
      .order("sale_date", { ascending: false })
      .limit(100),
    supabase
      .from("purchase_orders")
      .select(
        "id, order_number, order_date, total_amount, contacts!purchase_orders_supplier_id_fkey(name)",
      )
      .eq("organization_id", organizationId)
      .order("order_date", { ascending: false })
      .limit(100),
  ]);

  const returns: ReturnRow[] =
    (returnsResult.data ?? []).map((r) => ({
      id: r.id,
      return_number: r.return_number,
      return_date: r.return_date,
      type: r.type,
      reference_type: r.reference_type,
      reference_id: r.reference_id,
      contact_name: (r.contacts as { name: string } | null)?.name ?? null,
      status: r.status,
      total_amount: r.total_amount,
      reason: r.reason,
    })) ?? [];

  return (
    <ReturnsContent
      returns={returns}
      contacts={contactsResult.data ?? []}
      products={productsResult.data ?? []}
      sales={salesResult.data ?? []}
      purchaseOrders={purchaseOrdersResult.data ?? []}
    />
  );
}
