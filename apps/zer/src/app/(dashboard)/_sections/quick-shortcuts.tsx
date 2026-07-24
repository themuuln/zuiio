import {
  Buildings,
  CurrencyDollar,
  Package,
  Users,
  Warehouse,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { withDbCapture } from "@zuiio/capture";
import { cacheLife, cacheTag } from "next/cache";
import { ShortcutCard } from "@/components/dashboard/dashboard-cards";
import { formatCurrency } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/server-service";

type QuickStats = {
  product_count: number;
  customer_count: number;
  supplier_count: number;
  inventory_value: number;
  low_stock_count: number;
};

async function getQuickStats(organizationId: string): Promise<QuickStats> {
  "use cache";
  cacheLife("frequent");
  cacheTag(`customers:${organizationId}`);
  cacheTag(`products:${organizationId}`);
  cacheTag(`suppliers:${organizationId}`);

  // ⚠️ SERVICE ROLE — no RLS. Every query MUST filter by organizationId.
  const supabase = createServiceClient();

  const { data: stats } = await withDbCapture(
    "dashboard_quick_stats",
    supabase
      .rpc("get_dashboard_quick_stats", { p_organization_id: organizationId })
      .single(),
  );

  return {
    product_count: stats?.product_count ?? 0,
    customer_count: stats?.customer_count ?? 0,
    supplier_count: stats?.supplier_count ?? 0,
    inventory_value: stats?.inventory_value ?? 0,
    low_stock_count: stats?.low_stock_count ?? 0,
  };
}

export async function QuickShortcuts({ orgId }: { orgId: string }) {
  const stats = await getQuickStats(orgId);

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
          count={stats.product_count.toLocaleString()}
        />
        <ShortcutCard
          href="/customers"
          icon={<Users className="size-5" />}
          label="Харилцагчид"
          count={stats.customer_count.toLocaleString()}
        />
        <ShortcutCard
          href="/suppliers"
          icon={<Buildings className="size-5" />}
          label="Нийлүүлэгчид"
          count={stats.supplier_count.toLocaleString()}
        />
        <ShortcutCard
          href="/inventory"
          icon={<Warehouse className="size-5" />}
          label="Агуулах"
          count={formatCurrency(stats.inventory_value)}
        />
        <ShortcutCard
          href="/products"
          icon={<Warning className="size-5" />}
          label="Бага нөөц"
          count={stats.low_stock_count.toLocaleString()}
        />
        <ShortcutCard
          href="/sales"
          icon={<CurrencyDollar className="size-5" />}
          label="Борлуулалт"
          count={stats.product_count > 0 ? "Үзэх" : "—"}
        />
      </div>
    </div>
  );
}
