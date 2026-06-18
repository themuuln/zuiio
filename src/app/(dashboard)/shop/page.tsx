import { CatalogClient } from "@/components/shop/catalog-client";
import { requireAppContext } from "@/lib/erp";

export default async function ShopCatalogPage() {
  const { supabase, organizationId } = await requireAppContext();

  // Fetch products and categories in parallel
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, unit, sale_price, current_stock, category_id, brand_id, image_url, brands(name, logo_url)",
      )
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  ]);

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
    <div className="flex flex-col gap-1">
      <h1 className="text-lg font-semibold">Бүтээгдэхүүн</h1>
      <p className="text-sm text-muted-foreground">
        Бүтээгдэхүүн хайж, сагсанд нэмнэ үү.
      </p>
      <div className="mt-4">
        <CatalogClient products={productList} categories={categoryList} />
      </div>
    </div>
  );
}
