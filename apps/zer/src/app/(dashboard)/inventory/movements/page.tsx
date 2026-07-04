import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { withBranchFilter } from "@/lib/branches";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { type MovementRow, MovementsContent } from "./movements-content";



const PAGE_SIZE = 20;

const VALID_TYPES = new Set(["in", "out", "adjustment"]);

export default async function InventoryMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; page?: string; type?: string }>;
}) {
  const {
    branch: urlBranch,
    page: pageStr,
    type: typeFilter,
  } = await searchParams;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_inventory")))
    redirect("/");

  const currentPage = Math.max(1, Number(pageStr) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const resolvedType =
    typeFilter && VALID_TYPES.has(typeFilter) ? typeFilter : null;

  let query = supabase
    .from("stock_movements")
    .select(
      "id, type, quantity, unit_cost, reference, notes, created_at, products(name, unit, sku)",
      { count: "exact" },
    )
    .eq("organization_id", organizationId);

  if (resolvedType) {
    query = query.eq("type", resolvedType);
  }

  query = query.order("created_at", { ascending: false });

  const { data: movements, count } = await withBranchFilter(
    query,
    branchId,
    isBranchScoped,
    urlBranch,
  ).range(offset, offset + PAGE_SIZE - 1);

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;

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
      description="Орлого, зарлага, үлдэгдлийн тохируулгын бүртгэл."
      actions={
        <Button asChild>
          <Link href="/inventory/movements/new">
            <Plus data-icon="inline-start" />
            Шинэ хөдөлгөөн
          </Link>
        </Button>
      }
    >
      <MovementsContent
        movements={tableData}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={count ?? 0}
        currentType={resolvedType}
      />
    </PageShell>
  );
}
