"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { batchCreatePurchaseOrders } from "./actions";
import type { RestockProductRow, SupplierOption } from "./page";

export function RestockContent({
  products,
  suppliers,
}: {
  products: RestockProductRow[];
  suppliers: SupplierOption[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const q: Record<string, number> = {};
    for (const p of products) {
      q[p.id] = Math.max(1, (p.min_stock ?? 0) - (p.current_stock ?? 0));
    }
    return q;
  });
  const [unitCosts, setUnitCosts] = useState<Record<string, number>>(() => {
    const c: Record<string, number> = {};
    for (const p of products) {
      c[p.id] = p.cost_price ?? 0;
    }
    return c;
  });
  const [supplierIds, setSupplierIds] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    const defaultSupplierId = suppliers.length > 0 ? suppliers[0].id : "";
    for (const p of products) {
      s[p.id] = p.last_supplier_id || defaultSupplierId;
    }
    return s;
  });
  const [supplierQueries, setSupplierQueries] = useState<
    Record<string, string>
  >({});
  const [isCreating, setIsCreating] = useState(false);

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
    if (next.has(id)) next.delete(id);
    else next.add(id);
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

  return (
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
                          productId={product.id}
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
  );
}

function ProductSupplierCombobox({
  productId,
  suppliers,
  value,
  onChange,
  query,
  onQueryChange,
}: {
  productId: string;
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
