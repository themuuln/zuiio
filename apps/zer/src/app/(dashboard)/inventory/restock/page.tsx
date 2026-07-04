import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { RestockContent } from "./restock-content";

interface ProductQueryRow {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  cost_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  categories: { name: string } | null;
}

interface PurchaseOrderRef {
  supplier_id: string;
  contacts: { name: string } | null;
}

export interface RestockProductRow {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  category_name: string | null;
  current_stock: number | null;
  min_stock: number | null;
  cost_price: number | null;
  last_supplier_id: string | null;
  last_supplier_name: string | null;
}

export interface SupplierOption {
  id: string;
  name: string;
  phone: string | null;
}

export default async function RestockPage() {
  const { supabase, organizationId } = await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_inventory")))
    redirect("/");

  const [productsResult, suppliersResult] = await Promise.all([
    // Products with low stock
    supabase
      .from("products")
      .select(
        "id, name, sku, unit, cost_price, current_stock, min_stock, categories(name)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .gte("min_stock", 1)
      .order("name"),

    // All suppliers
    supabase
      .from("contacts")
      .select("id, name, phone")
      .eq("organization_id", organizationId)
      .eq("type", "supplier")
      .order("name"),
  ]);

  const suppliers: SupplierOption[] = (suppliersResult.data ?? []).map(
    (s: { id: string; name: string; phone: string | null }) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
    }),
  );

  const products = (productsResult.data ?? []).filter(
    (p: { current_stock: number | null; min_stock: number | null }) => {
      const currentStock = p.current_stock ?? 0;
      const minStock = p.min_stock ?? 0;
      return currentStock < minStock;
    },
  );

  // Get last supplier used per product from recent purchase orders
  const productIds = products.map((p: ProductQueryRow) => p.id);
  const lastSupplierMap: Record<string, { id: string; name: string } | null> =
    {};

  if (productIds.length > 0) {
    const { data: recentItems } = await supabase
      .from("purchase_order_items")
      .select(
        "product_id, purchase_order_id, purchase_orders!inner(supplier_id, contacts!purchase_orders_supplier_id_fkey(name))",
      )
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    if (recentItems) {
      for (const item of recentItems) {
        const pid = item.product_id;
        if (pid && !lastSupplierMap[pid]) {
          const po = item.purchase_orders as PurchaseOrderRef;
          lastSupplierMap[pid] = {
            id: po.supplier_id,
            name: po.contacts?.name ?? "",
          };
        }
      }
    }
  }

  const tableData: RestockProductRow[] = products.map((p: ProductQueryRow) => {
    const lastSupplier = lastSupplierMap[p.id] ?? null;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      category_name: (p.categories as { name: string } | null)?.name ?? null,
      current_stock: p.current_stock,
      min_stock: p.min_stock,
      cost_price: p.cost_price,
      last_supplier_id: lastSupplier?.id ?? null,
      last_supplier_name: lastSupplier?.name ?? null,
    };
  });

  return (
    <PageShell
      title="Дахин захиалах"
      description="Нөөц багатай бүтээгдэхүүнүүдийг сонгон нийлүүлэгчээр бүлэглэн захиалга үүсгэх"
    >
      {tableData.length === 0 ? (
        <ErpEmptyState
          icon={<Plus className="size-4" />}
          title="Захиалах зүйл байхгүй"
          description="Бүх бүтээгдэхүүний нөөц хангалттай байна. Бага нөөцтэй бүтээгдэхүүн энд харагдана."
          action={
            <Button asChild size="sm">
              <Link href="/inventory">
                <Plus data-icon="inline-start" />
                Агуулах руу буцах
              </Link>
            </Button>
          }
        />
      ) : (
        <RestockContent products={tableData} suppliers={suppliers} />
      )}
    </PageShell>
  );
}
