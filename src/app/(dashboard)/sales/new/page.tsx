import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";
import { SaleForm } from "./sale-form";

export default async function NewSalePage() {
  const { supabase, organizationId } = await requireAppContext();

  const [productsResult, customersResult] = await Promise.all([
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

  const products = productsResult.data ?? [];
  const customers = customersResult.data ?? [];

  return (
    <PageShell
      title="Борлуулалт нэмэх"
      description="Бүтээгдэхүүн, тоо хэмжээ, үнийг оруулан борлуулалт үүсгэнэ."
    >
      <SaleForm products={products} customers={customers} />
    </PageShell>
  );
}
