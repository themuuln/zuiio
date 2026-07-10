import {
  Barcode,
  Package as PackageIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { DynamicProductCreateDrawer } from "@/lib/dynamic-drawers";
import {
  type ProductRow,
  ProductsTable,
} from "@/components/products/products-table";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/erp";
import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";

const PAGE_SIZE = 20;

function PageSkeleton() {
  return (
    <PageShell
      title="Бүтээгдэхүүн"
      description="Бүтээгдэхүүний каталог, үлдэгдэл, үнийн мэдээллийг нэг дороос удирдана."
    >
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </PageShell>
  );
}

async function DataFetcher({ pageStr }: { pageStr?: string }) {
  const { supabase, organizationId } = await requireAppContext();

  const currentPage = Math.max(1, Number(pageStr) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { data: products, count } = await withDbCapture(
    "page:products",
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, unit, sale_price, cost_price, current_stock, min_stock, category_id, categories(name), brand_id, brands(name, logo_url), image_url",
        { count: "exact" },
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
  );

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;
  const totalCount = count ?? 0;

  const tableData: ProductRow[] =
    products?.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      unit: product.unit,
      sale_price: product.sale_price,
      cost_price: product.cost_price,
      current_stock: product.current_stock,
      min_stock: product.min_stock,
      category_id: product.category_id,
      category_name:
        (product.categories as { name: string } | null)?.name ?? null,
      brand_id: product.brand_id,
      brand_name:
        (product.brands as { name: string; logo_url: string | null } | null)
          ?.name ?? null,
      brand_logo_url:
        (product.brands as { name: string; logo_url: string | null } | null)
          ?.logo_url ?? null,
      image_url: product.image_url,
    })) ?? [];

  return (
    <PageShell
      title="Бүтээгдэхүүн"
      description="Бүтээгдэхүүний каталог, үлдэгдэл, үнийн мэдээллийг нэг дороос удирдана."
      actions={
        <>
          <ExportButton
            href="/api/export/products"
            filename={`products-${new Date().toISOString().slice(0, 10)}.csv`}
          />
          <DynamicProductCreateDrawer
            companyType=""
            organizationId={organizationId}
          />
        </>
      }
    >
      {!products?.length ? (
        <ErpEmptyState
          icon={<PackageIcon className="size-4" />}
          title="Бүтээгдэхүүн бүртгэгдээгүй"
          description="Шинэ бүтээгдэхүүн нэмж, каталог, үнэ, үлдэгдлээ тохируулна уу."
          action={
            <DynamicProductCreateDrawer
              companyType=""
              organizationId={organizationId}
            />
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ProductsTable
            data={tableData}
            organizationId={organizationId}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/products/bulk">
                <Barcode className="mr-2 size-4" />
                Баркод бөөнөөр
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/products/bundles">
                <PackageIcon className="mr-2 size-4" />
                Багц
              </Link>
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher pageStr={page} />
    </Suspense>
  );
}
