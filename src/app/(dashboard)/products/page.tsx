import { Package } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
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

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, sku, barcode, unit, sale_price, cost_price, current_stock, min_stock, category_id, categories(name)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

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
          <ProductCreateDrawer companyType="" />
        </>
      }
    >
      {!products?.length ? (
        <ErpEmptyState
          icon={<Package className="size-4" />}
          title="Бүтээгдэхүүн бүртгэгдээгүй"
          description="Шинэ бүтээгдэхүүн нэмж, каталог, үнэ, үлдэгдлээ тохируулна уу."
          action={<ProductCreateDrawer companyType="" />}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Бүтээгдэхүүний жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsTable data={tableData} />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
