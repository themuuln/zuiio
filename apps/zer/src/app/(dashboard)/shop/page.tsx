import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { PageShell } from "@/components/erp/page-shell";
import { CatalogClient } from "@/components/shop/catalog-client";
import { requireAppContext } from "@/lib/erp";
import { getVerticalPreset } from "@/lib/vertical-config";

function PageSkeleton() {
  return (
    <PageShell title="Борлуулалт" description="Барааны каталог">
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </PageShell>
  );
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  // Vertical config: NEXT_PUBLIC_VERTICAL_KEY env overrides default
  const verticalKey = process.env.NEXT_PUBLIC_VERTICAL_KEY ?? "default";
  const config = getVerticalPreset(verticalKey);

  const { data: products } = await withDbCapture(
    "shop_products",
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, unit, sale_price, current_stock, category_id, brand_id, image_url, brands(name, logo_url)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  );

  const { data: categories } = await withDbCapture(
    "shop_categories",
    supabase
      .from("categories")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  );

  const productList = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    unit: p.unit,
    sale_price: p.sale_price,
    current_stock: p.current_stock,
    category_id: p.category_id,
    image_url: p.image_url,
    brand_name:
      (p.brands as { name: string; logo_url: string | null } | null)?.name ??
      null,
    brand_logo_url:
      (p.brands as { name: string; logo_url: string | null } | null)
        ?.logo_url ?? null,
  }));

  const categoryList = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <CatalogClient
      products={productList}
      categories={categoryList}
      selectionMode={config.selectionMode}
    />
  );
}

export default async function ShopCatalogPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
