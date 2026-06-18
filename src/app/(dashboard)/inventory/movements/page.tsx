import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/erp";
import { withBranchFilter } from "@/lib/branches";
import { type MovementRow, MovementsContent } from "./movements-content";

export const unstable_instant = { prefetch: "static" };

export default async function InventoryMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch: urlBranch } = await searchParams;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();

  const { data: movements } = await withBranchFilter(
    supabase
      .from("stock_movements")
      .select(
        "id, type, quantity, unit_cost, reference, notes, created_at, products(name, unit, sku)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50),
    branchId,
    isBranchScoped,
    urlBranch,
  );

  const tableData: MovementRow[] =
    (movements ?? []).map((m) => {
      const product = m.products as {
        name: string;
        unit: string | null;
        sku: string | null;
      } | null;
      return {
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        unit_cost: m.unit_cost,
        reference: m.reference,
        notes: m.notes,
        created_at: m.created_at ?? new Date().toISOString(),
        product_name: product?.name ?? "Устсан бүтээгдэхүүн",
        product_unit: product?.unit ?? null,
        product_sku: product?.sku ?? null,
      };
    }) ?? [];

  return (
    <PageShell
      title="Барааны хөдөлгөөн"
      description="Орлого, зарлага, үлдэгдлийн тохируулгын сүүлийн 50 бүртгэл."
      actions={
        <Button asChild>
          <Link href="/inventory/movements/new">
            <Plus data-icon="inline-start" />
            Шинэ хөдөлгөөн
          </Link>
        </Button>
      }
    >
      <MovementsContent movements={tableData} />
    </PageShell>
  );
}
