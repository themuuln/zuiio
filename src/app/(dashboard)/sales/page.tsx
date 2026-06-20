import { requireAppContext } from "@/lib/erp";
import { withBranchFilter } from "@/lib/branches";
import { SalesContent } from "./sales-content";
import type { SaleRow } from "./sales-table";

export const unstable_instant = {
  prefetch: "static",
  samples: [
    { searchParams: { branch: null } },
    { searchParams: { branch: "sample" } },
  ],
  unstable_disableBuildValidation: true,
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch: urlBranch } = await searchParams;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();

  const [salesResult, productsResult, customersResult] = await Promise.all([
    withBranchFilter(
      supabase
        .from("sales")
        .select(
          "id, total_amount, paid_amount, sale_date, status, payment_method, contacts(name)",
        )
        .eq("organization_id", organizationId)
        .order("sale_date", { ascending: false }),
      branchId,
      isBranchScoped,
      urlBranch,
    ),
    supabase
      .from("products")
      .select("id, name, sale_price, current_stock, unit, barcode")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
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
