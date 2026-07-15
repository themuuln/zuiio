"use client";

import { Folder, MapPin, Plus, Warehouse } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { withDbCapture } from "@zuiio/capture";
import Link from "next/link";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { KpiGrid } from "@/components/erp/kpi-grid";
import { PageShell } from "@/components/erp/page-shell";
import { StatCard } from "@/components/erp/stat-card";
import { LowStockSection } from "@/components/inventory/low-stock-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

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
  product_name: string;
  product_unit: string | null;
};
const movementColumns: ColumnDef<RecentMovement>[] = [
  {
    accessorKey: "created_at",
    header: "Огноо",
    cell: ({ row }) => formatDate(row.getValue("created_at")),
  },
  {
    accessorKey: "product_name",
    header: "Бүтээгдэхүүн",
  },
  {
    accessorKey: "type",
    header: "Төрөл",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant={type === "out" ? "destructive" : "secondary"}>
          {MOVEMENT_LABELS[type] ?? type}
        </Badge>
      );
    },
  },
  {
    id: "quantity",
    accessorFn: (row) => `${row.quantity} ${row.product_unit ?? "ширхэг"}`,
    header: "Тоо хэмжээ",
  },
  {
    accessorKey: "unit_cost",
    header: "Өртөг",
    cell: ({ row }) => formatCurrency(Number(row.getValue("unit_cost") ?? 0)),
  },
  {
    id: "reference",
    accessorFn: (row) => row.reference ?? row.notes ?? "-",
    header: "Лавлагаа",
  },
];

function InventorySkeleton() {
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
      <div className="flex flex-1 flex-col gap-6">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    </PageShell>
  );
}

export function InventoryContent() {
  const { organizationId } = useOrgSettings();

  // ── Products query (used for KPIs, low stock computation) ──
  const productsQuery = useQuery({
    queryKey: ["inventory", "products", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:inventory:products",
        supabase
          .from("products")
          .select(
            "id, name, sku, unit, cost_price, current_stock, min_stock, categories(name)",
          )
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name", { ascending: true }),
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  // ── Recent movements query ──
  const movementsQuery = useQuery({
    queryKey: ["inventory", "movements", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:inventory:movements",
        supabase
          .from("stock_movements")
          .select(
            "id, type, quantity, unit_cost, reference, notes, created_at, products(name, unit)",
          )
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(10),
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  // ── Suppliers query ──
  const suppliersQuery = useQuery({
    queryKey: ["inventory", "suppliers", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:inventory:suppliers",
        supabase
          .from("contacts")
          .select("id, name, phone")
          .eq("organization_id", organizationId)
          .eq("type", "supplier")
          .order("name"),
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  const products = productsQuery.data ?? [];
  const stockMovements = movementsQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const isPending = productsQuery.isPending;

  // ── Compute KPIs ──
  const totalProducts = products.length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + (p.cost_price ?? 0) * (p.current_stock ?? 0),
    0,
  );

  const lowStockProducts: LowStockProduct[] = products
    .filter((p) => {
      const currentStock = p.current_stock ?? 0;
      const minStock = p.min_stock ?? 0;
      return currentStock < minStock;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      current_stock: p.current_stock,
      min_stock: p.min_stock,
      category_name: (p.categories as { name: string } | null)?.name ?? null,
      cost_price: p.cost_price,
    }));

  const movements: RecentMovement[] = stockMovements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    unit_cost: m.unit_cost,
    reference: m.reference,
    notes: m.notes,
    created_at: m.created_at ?? new Date().toISOString(),
    product_name:
      (m.products as { name: string; unit: string | null } | null)?.name ??
      "Устсан бүтээгдэхүүн",
    product_unit:
      (m.products as { name: string; unit: string | null } | null)?.unit ??
      null,
  }));

  if (isPending) {
    return <InventorySkeleton />;
  }

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
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Сүүлийн хөдөлгөөнүүд
            </h3>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Барааны хөдөлгөөн бүртгэгдээгүй байна.
              </p>
            ) : (
              <DataTable
                columns={movementColumns}
                data={movements}
                searchColumn="product_name"
                searchPlaceholder="Хайх..."
                pageSize={5}
                totalLabel="хөдөлгөөн"
                enableSorting
                enableColumnVisibility
              />
            )}
          </div>
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
