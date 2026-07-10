"use client";

import { Plus, ShoppingCart } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import { withDbCapture } from "@zuiio/capture";
import { batchCreatePurchaseOrders } from "./actions";

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

export function RestockContent() {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["restock", organizationId],
    queryFn: async () => {
      const supabase = createClient();

      const [productsResult, suppliersResult] = await Promise.all([
        withDbCapture(
          "page:restock:products",
          supabase
            .from("products")
            .select(
              "id, name, sku, unit, cost_price, current_stock, min_stock, categories(name)",
            )
            .eq("organization_id", organizationId)
            .is("deleted_at", null)
            .order("name", { ascending: true }),
        ),
        withDbCapture(
          "page:restock:suppliers",
          supabase
            .from("contacts")
            .select("id, name, phone")
            .eq("organization_id", organizationId)
            .eq("type", "supplier")
            .order("name"),
        ),
      ]);

      const rawProducts = (productsResult.data ?? []).filter(
        (p: { current_stock: number | null; min_stock: number | null }) => {
          const stock = p.current_stock ?? 0;
          const min = p.min_stock ?? 0;
          return stock < min;
        },
      );

      const suppliers: SupplierOption[] = (
        suppliersResult.data ?? []
      ).map(
        (s: { id: string; name: string; phone: string | null }) => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
        }),
      );

      const productIds = rawProducts.map(
        (p: { id: string }) => p.id,
      );
      const lastSupplierMap: Record<
        string,
        { id: string; name: string } | null
      > = {};

      if (productIds.length > 0) {
        const { data: recentItems } = await withDbCapture(
          "page:restock:purchase_items",
          supabase
            .from("purchase_order_items")
            .select(
              "product_id, purchase_order_id, purchase_orders!inner(supplier_id, contacts!inner(name))",
            )
            .eq("purchase_orders.organization_id", organizationId)
            .in("product_id", productIds)
            .order("created_at", { ascending: false }),
        );

        if (recentItems) {
          for (const item of recentItems) {
            const pid = item.product_id as string;
            if (!lastSupplierMap[pid]) {
              const po = item.purchase_orders as unknown as {
                supplier_id: string;
                contacts: { name: string } | null;
              };
              lastSupplierMap[pid] = po
                ? { id: po.supplier_id, name: po.contacts?.name ?? "—" }
                : null;
            }
          }
        }
      }

      const products: RestockProductRow[] = rawProducts.map(
        (p: {
          id: string;
          name: string;
          sku: string | null;
          unit: string | null;
          cost_price: number | null;
          current_stock: number | null;
          min_stock: number | null;
          categories: { name: string } | null;
        }) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          category_name: p.categories?.name ?? null,
          current_stock: p.current_stock,
          min_stock: p.min_stock,
          cost_price: p.cost_price,
          last_supplier_id: lastSupplierMap[p.id]?.id ?? null,
          last_supplier_name: lastSupplierMap[p.id]?.name ?? null,
        }),
      );

      return { products, suppliers };
    },
    enabled: !!organizationId,
  });

  const { products = [], suppliers = [] } = query.data ?? {};
  const isLoading = query.isLoading || query.isFetching;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [unitCosts, setUnitCosts] = useState<Record<string, number>>({});
  const [supplierIds, setSupplierIds] = useState<Record<string, string>>({});
  const [supplierQueries, setSupplierQueries] = useState<
    Record<string, string>
  >({});
  const [isCreating, setIsCreating] = useState(false);

  // Initialize computed state from fetched data (once)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!query.data || initializedRef.current) return;
    initializedRef.current = true;

    const { products: prods, suppliers: supps } = query.data;
    const defaultSupplierId = supps.length > 0 ? supps[0].id : "";

    setQuantities(
      Object.fromEntries(
        prods.map((p) => [
          p.id,
          Math.max(1, (p.min_stock ?? 0) - (p.current_stock ?? 0)),
        ]),
      ),
    );
    setUnitCosts(
      Object.fromEntries(prods.map((p) => [p.id, p.cost_price ?? 0])),
    );
    setSupplierIds(
      Object.fromEntries(
        prods.map((p) => [p.id, p.last_supplier_id || defaultSupplierId]),
      ),
    );
  }, [query.data]);

  const allSelected = products.length > 0 && selected.size === products.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const toggleProduct = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const setProductSupplierQuery = (productId: string, query: string) => {
    setSupplierQueries((prev) => ({ ...prev, [productId]: query }));
  };

  const handleCreateOrders = useCallback(async () => {
    const selectedProducts = products.filter((p) => selected.has(p.id));
    if (selectedProducts.length === 0) {
      toast.error("Захиалах бүтээгдэхүүн сонгоно уу.");
      return;
    }

    setIsCreating(true);

    // Group by supplier — products without a supplier go to their own group
    const grouped: Record<
      string,
      {
        supplier_id: string | null;
        items: Array<{
          product_id: string;
          quantity: number;
          unit_cost: number;
        }>;
      }
    > = {};
    for (const p of selectedProducts) {
      const sid = supplierIds[p.id] || "__no_supplier__";
      if (!grouped[sid]) {
        grouped[sid] = {
          supplier_id: supplierIds[p.id] || null,
          items: [],
        };
      }
      grouped[sid].items.push({
        product_id: p.id,
        quantity: quantities[p.id] ?? 1,
        unit_cost: unitCosts[p.id] ?? 0,
      });
    }

    const result = await batchCreatePurchaseOrders(Object.values(grouped));

    if (result && "createdCount" in result) {
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.createdCount} захиалга амжилттай үүсгэгдлээ.`);
        setSelected(new Set());
      }
    }

    setIsCreating(false);
  }, [products, selected, supplierIds, quantities, unitCosts]);

  const pageActions = (
    <Button asChild size="sm">
      <Link href="/inventory/movements/new">
        <Plus data-icon="inline-start" />
        Шинэ хөдөлгөөн бүртгэх
      </Link>
    </Button>
  );

  return (
    <PageShell
      title="Дахин захиалах"
      description="Нөөц багатай бүтээгдэхүүнүүдийг сонгон нийлүүлэгчээр бүлэглэн захиалга үүсгэх"
      actions={pageActions}
    >
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
          </Card>
          <Skeleton className="h-10 w-72 rounded-lg" />
          <Card>
            <CardContent className="p-0">
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : !products.length ? (
        <ErpEmptyState
          icon={<Plus className="size-4" />}
          title="Бага нөөцтэй бүтээгдэхүүн байхгүй"
          description="Бүх бүтээгдэхүүний нөөц хангалттай байна."
          action={
            <Button asChild size="sm">
              <Link href="/inventory/movements/new">
                <Plus data-icon="inline-start" />
                Шинэ хөдөлгөөн бүртгэх
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                Нийт: {products.length} бүтээгдэхүүн, {selected.size} сонгосон
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {allSelected ? "Бүгдийг цуцлах" : "Бүгдийг сонгох"}
            </Button>
            <Button
              size="sm"
              onClick={handleCreateOrders}
              disabled={selected.size === 0 || isCreating}
            >
              <ShoppingCart className="mr-1.5 size-4" />
              {isCreating
                ? "Үүсгэж байна..."
                : `Захиалга үүсгэх (${selected.size})`}
            </Button>
          </div>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="size-4"
                      />
                    </TableHead>
                    <TableHead>Бүтээгдэхүүн</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Одоогийн нөөц</TableHead>
                    <TableHead className="text-right">Минимум нөөц</TableHead>
                    <TableHead className="text-right w-28">Тоо хэмжээ</TableHead>
                    <TableHead className="text-right w-28">Өртөг</TableHead>
                    <TableHead className="w-48">Нийлүүлэгч</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const isItemSelected = selected.has(product.id);
                    const suggested = Math.max(
                      1,
                      (product.min_stock ?? 0) - (product.current_stock ?? 0),
                    );

                    return (
                      <TableRow
                        key={product.id}
                        className={isItemSelected ? "bg-accent/50" : undefined}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isItemSelected}
                            onChange={() => toggleProduct(product.id)}
                            className="size-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.sku ?? "-"}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {product.current_stock?.toLocaleString() ?? 0}{" "}
                          {product.unit ?? "ширхэг"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.min_stock?.toLocaleString() ?? 0}{" "}
                          {product.unit ?? "ширхэг"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="any"
                            min="0.01"
                            className="h-8 text-right"
                            value={quantities[product.id] ?? suggested}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [product.id]: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            className="h-8 text-right"
                            value={unitCosts[product.id] ?? 0}
                            onChange={(e) =>
                              setUnitCosts((prev) => ({
                                ...prev,
                                [product.id]: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {isItemSelected ? (
                            <ProductSupplierCombobox
                              suppliers={suppliers}
                              value={supplierIds[product.id] ?? ""}
                              onChange={(sid) =>
                                setSupplierIds((prev) => ({
                                  ...prev,
                                  [product.id]: sid,
                                }))
                              }
                              query={supplierQueries[product.id] ?? ""}
                              onQueryChange={(q) =>
                                setProductSupplierQuery(product.id, q)
                              }
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {product.last_supplier_name ?? "Сонгоогүй"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bottom Summary */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {selected.size} бүтээгдэхүүн сонгогдсон
            </span>
            <Button
              size="sm"
              onClick={handleCreateOrders}
              disabled={selected.size === 0 || isCreating}
            >
              <ShoppingCart className="mr-1.5 size-4" />
              {isCreating
                ? "Үүсгэж байна..."
                : `Захиалга үүсгэх (${selected.size})`}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function ProductSupplierCombobox({
  suppliers,
  value,
  onChange,
  query,
  onQueryChange,
}: {
  suppliers: SupplierOption[];
  value: string;
  onChange: (supplierId: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const trimmedQuery = query.trim().toLowerCase();
  const filtered = trimmedQuery
    ? suppliers.filter((s) => s.name.toLowerCase().includes(trimmedQuery))
    : suppliers;

  return (
    <Combobox
      items={filtered}
      value={suppliers.find((s) => s.id === value) ?? null}
      onValueChange={(next: { id: string; name: string } | null) => {
        onChange(next?.id ?? "");
        onQueryChange("");
      }}
      itemToStringValue={(c: { id: string } | null) => c?.id ?? ""}
      itemToStringLabel={(c: { name: string } | null) => c?.name ?? ""}
      inputValue={query}
      onInputValueChange={onQueryChange}
    >
      <ComboboxInput
        placeholder="Нийлүүлэгч..."
        showTrigger
        className="h-8 text-xs"
      />
      <ComboboxContent>
        <ComboboxEmpty>Олдсонгүй</ComboboxEmpty>
        <ComboboxList>
          {(s: { id: string; name: string }) => (
            <ComboboxItem key={s.id}>{s.name}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
