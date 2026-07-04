import { Package, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { BundleCreateDrawer } from "@/components/products/bundle-create-drawer";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/erp";
import { BundlesContent } from "./bundles-content";
import type { BundleRow, SimpleProductOption } from "./types";

export type { BundleRow, SimpleProductOption };



export default async function BundlesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const [bundlesResult, productsResult] = await Promise.all([
    supabase
      .from("product_bundles")
      .select(
        "id, name, sku, sale_price, cost_price, description, is_active, created_at, product_bundle_items(id, product_id, quantity, products!inner(name, sku))",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),

    supabase
      .from("products")
      .select("id, name, sku, sale_price, cost_price")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
  ]);

  const bundles = (bundlesResult.data ?? []) as BundleRow[];
  const products: SimpleProductOption[] = (productsResult.data ?? []).map(
    (p: {
      id: string;
      name: string;
      sku: string | null;
      sale_price: number | null;
      cost_price: number | null;
    }) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      sale_price: p.sale_price,
      cost_price: p.cost_price,
    }),
  );

  return (
    <PageShell
      title="Багц бүтээгдэхүүн"
      description="Олон бүтээгдэхүүнийг нэг багц болгон борлуулах"
      actions={
        <BundleCreateDrawer
          products={products}
          trigger={
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Шинэ багц
            </Button>
          }
        />
      }
    >
      {!bundles.length ? (
        <ErpEmptyState
          icon={<Package className="size-4" />}
          title="Багц бүртгэгдээгүй"
          description="Олон бүтээгдэхүүнийг нэгтгэн багц болгон борлуулах боломжтой."
          action={
            <BundleCreateDrawer
              products={products}
              trigger={
                <Button size="sm">
                  <Plus data-icon="inline-start" />
                  Шинэ багц
                </Button>
              }
            />
          }
        />
      ) : (
        <BundlesContent bundles={bundles} products={products} />
      )}
    </PageShell>
  );
}
