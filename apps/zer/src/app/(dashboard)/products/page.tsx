import { Package as PackageIcon } from "@phosphor-icons/react/dist/ssr";
import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  type ProductRow,
  ProductsTable,
} from "@/components/products/products-table";
import { DynamicProductCreateDrawer } from "@/lib/dynamic-drawers";
import { requireAppContext } from "@/lib/erp";

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

async function DataFetcher({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = (await searchParams) ?? {};
  const { supabase, organizationId } = await requireAppContext();

  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { data: products, count } = await withDbCapture(
    "page:products",
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, unit, sale_price, cost_price, current_stock, min_stock, category_id, categories(name), brand_id, brands(name, logo_url), image_url, description, material_type, additional_info, usage_instructions, care_instructions, has_variants, is_public",
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
      description: product.description,
      material_type: product.material_type,
      additional_info: product.additional_info,
      usage_instructions: product.usage_instructions,
      care_instructions: product.care_instructions,
      has_variants: product.has_variants,
      is_public: product.is_public,
    })) ?? [];

  return (
    <PageShell
      title="Бүтээгдэхүүн"
      description="Бүтээгдэхүүний каталог, үлдэгдэл, үнийн мэдээллийг нэг дороос удирдана."
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
        <ProductsTable
          data={tableData}
          organizationId={organizationId}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      )}
    </PageShell>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher searchParams={searchParams} />
    </Suspense>
  );
}
