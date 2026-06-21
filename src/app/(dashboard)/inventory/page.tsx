import {
  Folder,
  MapPin,
  Plus,
  Warehouse,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { KpiGrid } from "@/components/erp/kpi-grid";
import { PageShell } from "@/components/erp/page-shell";
import { StatCard } from "@/components/erp/stat-card";
import { LowStockSection } from "@/components/inventory/low-stock-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/erp";
import { formatCurrency, formatDate } from "@/lib/format";

export const unstable_instant = {
  prefetch: "static",
  unstable_disableValidation: true,
};

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Орлого",
  out: "Зарлага",
  adjustment: "Тохируулга",
};

export type LowStockProduct = {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  current_stock: number | null;
  min_stock: number | null;
  category_name: string | null;
  cost_price: number | null;
};

export type RecentMovement = {
  id: string;
  type: string;
  quantity: number;
  unit_cost: number | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  product_name: string | null;
  product_unit: string | null;
};

export default async function InventoryOverviewPage() {
  const { supabase, organizationId } = await requireAppContext();

  const [
    productsResult,
    inventoryProductsResult,
    movementsResult,
    suppliersResult,
  ] = await Promise.all([
    // 1. All products with stock info for low stock detection
    supabase
      .from("products")
      .select(
        "id, name, sku, unit, cost_price, current_stock, min_stock, categories(name)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),

    // 2. Inventory value data (cost_price * current_stock)
    supabase
      .from("products")
      .select("cost_price, current_stock")
      .eq("organization_id", organizationId)
      .is("deleted_at", null),

    // 3. Recent 10 stock movements
    supabase
      .from("stock_movements")
      .select(
        "id, type, quantity, unit_cost, reference, notes, created_at, products(name, unit)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),

    // 4. Suppliers for restock drawer
    supabase
      .from("contacts")
      .select("id, name, phone")
      .eq("organization_id", organizationId)
      .eq("type", "supplier")
      .order("name"),
  ]);

  const products = productsResult.data ?? [];
  const totalProducts = products.length;
  const suppliers = suppliersResult.data ?? [];

  // Compute inventory value
  const inventoryValue = (inventoryProductsResult.data ?? []).reduce(
    (sum, product) =>
      sum + (product.cost_price ?? 0) * (product.current_stock ?? 0),
    0,
  );

  // Identify low stock products
  const lowStockProducts: LowStockProduct[] = products
    .filter((product) => {
      const currentStock = product.current_stock ?? 0;
      const minStock = product.min_stock ?? 0;
      return currentStock < minStock;
    })
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      current_stock: product.current_stock,
      min_stock: product.min_stock,
      category_name:
        (product.categories as { name: string } | null)?.name ?? null,
      cost_price: product.cost_price,
    }));

  const movements: RecentMovement[] = (movementsResult.data ?? []).map(
    (movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      unit_cost: movement.unit_cost,
      reference: movement.reference,
      notes: movement.notes,
      created_at: movement.created_at ?? new Date().toISOString(),
      product_name:
        (movement.products as { name: string; unit: string | null } | null)
          ?.name ?? "Устсан бүтээгдэхүүн",
      product_unit:
        (movement.products as { name: string; unit: string | null } | null)
          ?.unit ?? null,
    }),
  );

  const hasAnyProducts = totalProducts > 0;
  const hasStockValue = inventoryValue > 0;

  return (
    <PageShell
      title="Агуулах"
      description="Агуулахын үлдэгдэл, нөөц, барааны хөдөлгөөний мэдээлэл"
      actions={
        <ExportButton
          href="/api/export/inventory"
          filename={`inventory-${new Date().toISOString().slice(0, 10)}.csv`}
        />
      }
    >
      {!hasAnyProducts && !hasStockValue ? (
        <>
          {/* Summary cards still visible in empty state */}
          <KpiGrid>
            <StatCard
              label="Нийт бүтээгдэхүүн"
              value={totalProducts.toLocaleString()}
            />
            <StatCard
              label="Агуулахын үнэ цэнэ"
              value={formatCurrency(inventoryValue)}
            />
            <StatCard
              label="Бага нөөцтэй бүтээгдэхүүн"
              value={lowStockProducts.length.toLocaleString()}
            />
          </KpiGrid>

          <ErpEmptyState
            icon={<Warehouse className="size-4" />}
            title="Бүтээгдэхүүн бүртгэгдээгүй"
            description="Агуулахын мэдээлэл харагдахын тулд эхлээд бүтээгдэхүүн нэмнэ үү."
            action={
              <Button asChild size="sm">
                <Link href="/products">
                  <Plus data-icon="inline-start" />
                  Бүтээгдэхүүн нэмэх
                </Link>
              </Button>
            }
          />
        </>
      ) : (
        <div className="flex flex-1 flex-col gap-6">
          {/* Summary KPI Cards */}
          <KpiGrid>
            <StatCard
              label="Нийт бүтээгдэхүүн"
              value={totalProducts.toLocaleString()}
            />
            <StatCard
              label="Агуулахын үнэ цэнэ"
              value={formatCurrency(inventoryValue)}
            />
            <StatCard
              label="Бага нөөцтэй бүтээгдэхүүн"
              value={lowStockProducts.length.toLocaleString()}
            />
          </KpiGrid>

          {/* Low Stock Products */}
          <LowStockSection
            products={lowStockProducts}
            suppliers={suppliers.map(
              (s: { id: string; name: string; phone: string | null }) => ({
                id: s.id,
                name: s.name,
                phone: s.phone,
              }),
            )}
          />

          {/* Recent Stock Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Сүүлийн хөдөлгөөнүүд</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {movements.length === 0 ? (
                <div className="px-6 pb-6 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Барааны хөдөлгөөн бүртгэгдээгүй байна.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо</TableHead>
                      <TableHead>Бүтээгдэхүүн</TableHead>
                      <TableHead>Төрөл</TableHead>
                      <TableHead>Тоо хэмжээ</TableHead>
                      <TableHead>Өртөг</TableHead>
                      <TableHead>Лавлагаа</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{formatDate(movement.created_at)}</TableCell>
                        <TableCell className="font-medium">
                          {movement.product_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              movement.type === "out"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {MOVEMENT_LABELS[movement.type] ?? movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {movement.quantity}{" "}
                          {movement.product_unit ?? "ширхэг"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(movement.unit_cost ?? 0))}
                        </TableCell>
                        <TableCell>
                          {movement.reference ?? movement.notes ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/inventory/categories">
                <Folder className="mr-2 size-4" />
                Ангилалууд
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/inventory/movements">
                <Warehouse className="mr-2 size-4" />
                Барааны хөдөлгөөн
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/inventory/warehouses">
                <MapPin className="mr-2 size-4" />
                Агуулахууд
              </Link>
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
