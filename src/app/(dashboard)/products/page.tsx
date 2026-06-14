import { Package } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { ProductCreateDrawer } from "@/components/products/product-create-drawer";
import {
  type ProductRow,
  ProductsTable,
} from "@/components/products/products-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";

export default async function ProductsPage() {
  const { supabase, organizationId } = await requireAppContext();

  const [{ data: products }, { data: categories }, { data: org }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, sku, barcode, unit, sale_price, cost_price, current_stock, min_stock, image_url, image_urls, categories(name)",
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("id")
        .eq("organization_id", organizationId),
      supabase
        .from("organizations")
        .select("company_type")
        .eq("id", organizationId)
        .single(),
    ]);

  const productCount = products?.length ?? 0;
  const lowStockCount =
    products?.filter(
      (product) =>
        Number(product.current_stock ?? 0) <= Number(product.min_stock ?? 0),
    ).length ?? 0;

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
      image_url: product.image_url,
      image_urls: product.image_urls,
      category_name: product.categories?.name ?? null,
      is_low:
        Number(product.current_stock ?? 0) <= Number(product.min_stock ?? 0),
    })) ?? [];

  return (
    <PageShell
      title="Бүтээгдэхүүн"
      description="Каталог, SKU, үнэ, үлдэгдлээ нэг дороос удирдана."
      actions={
        <ProductCreateDrawer companyType={org?.company_type ?? "retail"} />
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Нийт бүтээгдэхүүн</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {productCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ангилал</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {categories?.length ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Дуусах гэж буй</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">
            {lowStockCount}
          </CardContent>
        </Card>
      </div>

      {!products?.length ? (
        <ErpEmptyState
          icon={<Package className="size-4" />}
          title="Анхны бүтээгдэхүүнээ нэмнэ үү"
          description="Каталог үүсгэсний дараа борлуулалт болон агуулахын урсгалыг бүртгэхэд бэлэн болно."
          action={
            <ProductCreateDrawer companyType={org?.company_type ?? "retail"} />
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Каталогийн жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsTable data={tableData} />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
