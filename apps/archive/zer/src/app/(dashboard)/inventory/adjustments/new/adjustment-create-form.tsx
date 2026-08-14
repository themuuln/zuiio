"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
import { ErrorBanner } from "@/components/ui/error-banner";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { productKeys } from "@/lib/query/keys";
import { createBatchAdjustment } from "../actions";
import type { ProductOption } from "./page";

interface AdjustmentRow {
  id: string;
  product: ProductOption;
  newStock: number;
}

export function AdjustmentCreateForm({
  products,
}: {
  products: ProductOption[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<AdjustmentRow[]>([]);
  const [notes, setNotes] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productQuery, setProductQuery] = useState("");

  const trimmedQuery = productQuery.trim().toLowerCase();
  const filteredProducts = trimmedQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmedQuery) ||
          (p.sku ?? "").toLowerCase().includes(trimmedQuery),
      )
    : products;

  // Non-selected products (for combobox filtering)
  const selectedIds = new Set(rows.map((r) => r.product.id));
  const availableProducts = filteredProducts.filter(
    (p) => !selectedIds.has(p.id),
  );

  const addProduct = (product: ProductOption) => {
    if (selectedIds.has(product.id)) return;
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        product,
        newStock: product.current_stock ?? 0,
      },
    ]);
    setProductQuery("");
  };

  const updateNewStock = (rowId: string, value: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, newStock: value } : r)),
    );
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleSubmit = useCallback(async () => {
    if (rows.length === 0) {
      toast.error("Дор хаяж нэг бараа нэмнэ үү.");
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    const items = rows.map((r) => ({
      product_id: r.product.id,
      variant_id: null,
      quantity: (r.newStock ?? 0) - (r.product.current_stock ?? 0),
      unit_cost: r.product.cost_price,
    }));

    const formData = new FormData();
    formData.append("notes", notes);
    formData.append("items", JSON.stringify(items));

    const result = await createBatchAdjustment(undefined, formData);

    if (result?.error) {
      setServerError(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Тохируулга амжилттай хадгалагдлаа.");
    queryClient.invalidateQueries({ queryKey: productKeys.all() });
    queryClient.invalidateQueries({ queryKey: ["shop_products"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    router.push("/inventory/adjustments");
  }, [rows, notes, queryClient, router]);

  const totalImpact = rows.reduce(
    (sum, r) => sum + (r.newStock ?? 0) - (r.product.current_stock ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {serverError && <ErrorBanner error={serverError} />}

      {/* Product Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Бараа нэмэх</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Combobox
                items={availableProducts}
                value={null}
                onValueChange={(next: ProductOption | null) => {
                  if (next) addProduct(next);
                }}
                itemToStringValue={(p: ProductOption | null) => p?.id ?? ""}
                itemToStringLabel={(p: ProductOption | null) => p?.name ?? ""}
                inputValue={productQuery}
                onInputValueChange={setProductQuery}
              >
                <ComboboxInput
                  placeholder="Бараа хайх..."
                  showTrigger
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Бараа олдсонгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(p: ProductOption) => (
                      <ComboboxItem key={p.id}>
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          {p.sku && (
                            <span className="text-xs text-muted-foreground">
                              {p.sku}
                            </span>
                          )}
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {p.current_stock ?? 0} {p.unit ?? "ширхэг"}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Table */}
      {rows.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Бүтээгдэхүүн</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">
                    Одоогийн үлдэгдэл
                  </TableHead>
                  <TableHead className="text-right w-28">
                    Шинэ үлдэгдэл
                  </TableHead>
                  <TableHead className="text-right w-28">Зөрүү</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const diff =
                    (row.newStock ?? 0) - (row.product.current_stock ?? 0);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.product.sku ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.product.current_stock?.toLocaleString() ?? 0}{" "}
                        {row.product.unit ?? "ширхэг"}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          className="h-8 text-right"
                          value={row.newStock}
                          onChange={(e) =>
                            updateNewStock(
                              row.id,
                              Math.max(0, Number(e.target.value) || 0),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          diff > 0
                            ? "text-green-600"
                            : diff < 0
                              ? "text-destructive"
                              : ""
                        }`}
                      >
                        {diff > 0 ? "+" : ""}
                        {diff.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => removeRow(row.id)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Тайлбар</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Тохируулгын тайлбар (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Summary & Submit */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-4 text-sm">
            <span>
              <strong>{rows.length}</strong> бараа
            </span>
            <span
              className={
                totalImpact > 0
                  ? "text-green-600"
                  : totalImpact < 0
                    ? "text-destructive"
                    : ""
              }
            >
              Нийт: {totalImpact > 0 ? "+" : ""}
              {totalImpact.toLocaleString()} ширхэг
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRows([]);
                setNotes("");
                setServerError(null);
              }}
            >
              Цэвэрлэх
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
              <Plus className="mr-1.5 size-4" />
              {isSubmitting ? "Хадгалж байна..." : "Тохируулга хадгалах"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
