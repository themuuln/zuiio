import { CatalogClient } from "@/components/shop/catalog-client";
import { requireAppContext } from "@/lib/erp";

export default async function ShopCatalogPage() {
  const { supabase, organizationId } = await requireAppContext();

  // Fetch products and categories in parallel
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, sku, unit, sale_price, current_stock, category_id")
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
    unit: p.unit,
    sale_price: p.sale_price,
    current_stock: p.current_stock,
    category_id: p.category_id,
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
