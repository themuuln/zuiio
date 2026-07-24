import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { PageShell } from "@/components/erp/page-shell";
import { withBranchFilter } from "@/lib/branches";
import { requireAppContext } from "@/lib/erp";
import { SalesContent } from "./sales-content";
import type { SaleRow } from "./sales-table";

/** Skeleton shown while sale data streams in */
function SalesSkeleton() {
  return (
    <PageShell
      title="Борлуулалт"
      description="Борлуулалтын жагсаалт, статус, төлбөрийн мэдээлэл."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-7 w-20 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    </PageShell>
  );
}

/** Fetches sales data and renders the content */
async function SalesDataFetcher({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch: urlBranch } = await searchParams;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();

  const [salesResult, productsResult] = await Promise.all([
    withDbCapture(
      "page:sales",
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
    ),
    withDbCapture(
      "page:sales",
      supabase
        .from("products")
        .select("id, name, sale_price, current_stock, unit, barcode, image_url")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name"),
    ),
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

  return <SalesContent sales={sales} products={productsResult.data ?? []} />;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  return (
    <Suspense fallback={<SalesSkeleton />}>
      <SalesDataFetcher searchParams={searchParams} />
    </Suspense>
  );
}
