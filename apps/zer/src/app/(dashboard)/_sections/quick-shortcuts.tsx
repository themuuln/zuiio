import {
  Buildings,
  CurrencyDollar,
  Package,
  Users,
  Warehouse,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { withDbCapture } from "@zuiio/capture";
import { ShortcutCard } from "@/components/dashboard/dashboard-cards";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function QuickShortcuts({ orgId }: { orgId: string }) {
  const supabase = await createClient();

  const [productsResult, customersResult, suppliersResult, inventoryResult] =
    await Promise.all([
      withDbCapture(
        "dashboard_quick_products",
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .is("deleted_at", null),
      ).then(
        (r) =>
          r as unknown as {
            data: Array<{ id: string }> | null;
            count: number | null;
            error: unknown;
          },
      ),
      withDbCapture(
        "dashboard_quick_customers",
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("type", "customer"),
      ).then(
        (r) =>
          r as unknown as {
            data: Array<{ id: string }> | null;
            count: number | null;
            error: unknown;
          },
      ),
      withDbCapture(
        "dashboard_quick_suppliers",
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("type", "supplier"),
      ).then(
        (r) =>
          r as unknown as {
            data: Array<{ id: string }> | null;
            count: number | null;
            error: unknown;
          },
      ),
      withDbCapture(
        "dashboard_quick_inventory",
        supabase
          .from("products")
          .select("cost_price, current_stock, min_stock")
          .eq("organization_id", orgId)
          .is("deleted_at", null),
      ),
    ]);

  const totalProducts = productsResult.count ?? 0;
  const totalCustomers = customersResult.count ?? 0;
  const totalSuppliers = suppliersResult.count ?? 0;

  const inventoryValue = (inventoryResult.data ?? []).reduce(
    (sum, product) =>
      sum + (product.cost_price ?? 0) * (product.current_stock ?? 0),
    0,
  );

  const lowStockCount = (inventoryResult.data ?? []).filter((product) => {
    const currentStock = product.current_stock ?? 0;
    const minStock = product.min_stock ?? 0;
    return currentStock < minStock;
  }).length;

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Түргэн цэс
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ShortcutCard
          href="/products"
          icon={<Package className="size-5" />}
          label="Бүтээгдэхүүн"
          count={totalProducts.toLocaleString()}
        />
        <ShortcutCard
          href="/customers"
          icon={<Users className="size-5" />}
          label="Харилцагчид"
          count={totalCustomers.toLocaleString()}
        />
        <ShortcutCard
          href="/suppliers"
          icon={<Buildings className="size-5" />}
          label="Нийлүүлэгчид"
          count={totalSuppliers.toLocaleString()}
        />
        <ShortcutCard
          href="/inventory"
          icon={<Warehouse className="size-5" />}
          label="Агуулах"
          count={formatCurrency(inventoryValue)}
        />
        <ShortcutCard
          href="/products"
          icon={<Warning className="size-5" />}
          label="Бага нөөц"
          count={lowStockCount.toLocaleString()}
        />
        <ShortcutCard
          href="/sales"
          icon={<CurrencyDollar className="size-5" />}
          label="Борлуулалт"
          count={totalProducts > 0 ? "Үзэх" : "—"}
        />
      </div>
    </div>
  );
}
