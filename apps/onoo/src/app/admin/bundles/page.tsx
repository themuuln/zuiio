"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { z } from "zod";
import type { ShopBundleRow, ShopProductRow } from "@/app/admin/_lib/api";
import { shopBundlesApi, shopProductsApi } from "@/app/admin/_lib/api";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEntityCrud } from "@/hooks/use-entity-crud";

const bundleSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  description: z.string().optional(),
  discount_percent: z.coerce
    .number()
    .int()
    .min(0, "0-с их")
    .max(100, "100-аас бага"),
  is_active: z.boolean().optional(),
});

const dateFormatter = new Intl.DateTimeFormat("mn-MN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

async function setBundleItems(bundleId: string, productIds: string[]) {
  const res = await fetch("/admin/api/bundle-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bundle_id: bundleId, product_ids: productIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Алдаа гарлаа");
  }
}

export default function AdminBundlesPage() {
  const queryClient = useQueryClient();

  const { data: bundles = [], isPending } = useQuery({
    queryKey: ["admin", "bundles"],
    queryFn: () => shopBundlesApi.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => shopProductsApi.list(),
  });

  const crud = useEntityCrud({
    api: shopBundlesApi,
    queryKey: ["admin", "bundles"],
    schema: bundleSchema,
    defaultValues: {
      name: "",
      description: "",
      discount_percent: "",
      is_active: true,
    },
    successMessages: {
      create: "Багц амжилттай үүсгэлээ",
      update: "Багц амжилттай шинэчлэлээ",
      delete: "Багц устгагдлаа",
    },
    editMap: (row: ShopBundleRow) => ({
      name: row.name,
      description: row.description ?? "",
      discount_percent: row.discount_percent,
      is_active: row.is_active,
    }),
  });

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [savingItems, setSavingItems] = useState(false);

  // Fetch bundle items when editing
  const editingBundleId = crud.editingItem?.id;
  const { data: currentItems } = useQuery({
    queryKey: ["admin", "bundle-items", editingBundleId],
    queryFn: async () => {
      if (!editingBundleId) return [];
      const res = await fetch(
        `/admin/api/bundle-items?bundle_id=${editingBundleId}`,
      );
      if (!res.ok) return [];
      return res.json() as Promise<Array<{ product_id: string }>>;
    },
    enabled: !!editingBundleId,
  });

  // Sync selected product IDs when dialog opens
  useEffect(() => {
    if (crud.dialogOpen && currentItems) {
      setSelectedProductIds(currentItems.map((i) => i.product_id));
    } else if (!crud.dialogOpen) {
      setSelectedProductIds([]);
    }
  }, [crud.dialogOpen, currentItems]);

  function toggleProduct(productId: string) {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }

  // Calculate bundle pricing
  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id),
  );
  const totalOriginal = selectedProducts.reduce(
    (sum, p) => sum + p.price_mnt,
    0,
  );
  const discountPercent = crud.form.watch("discount_percent") || 0;
  const totalDiscounted = Math.round(
    totalOriginal * (1 - Number(discountPercent) / 100),
  );

  const saveBundleMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const bundle = crud.editingItem
        ? await shopBundlesApi.update(
            crud.editingItem.id,
            values as Partial<ShopBundleRow>,
          )
        : await shopBundlesApi.create(values as Partial<ShopBundleRow>);
      if (!bundle) throw new Error("Failed to save bundle");
      await setBundleItems(bundle.id, selectedProductIds);
      return bundle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
      crud.handleDialogOpenChange(false);
    },
    onError: () => toast.error("Алдаа гарлаа"),
  });

  const handleDialogSubmit = crud.form.handleSubmit(async (values) => {
    saveBundleMutation.mutate(values);
  });

  const columns: ColumnDef<ShopBundleRow>[] = [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "discount_percent",
      header: "Хямдрал",
      cell: ({ row }) => (
        <span className="font-medium text-green-600">
          {row.original.discount_percent}%
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Статус",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Үүсгэсэн",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {dateFormatter.format(new Date(row.original.created_at))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Үйлдэл",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => crud.handleEdit(row.original)}
            title="Засах"
          >
            <Edit className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() =>
              crud.handleDelete(row.original, "Багцыг устгах уу?")
            }
            title="Устгах"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageLayout
        title="Багц"
        loading={isPending}
        isEmpty={bundles.length === 0}
        emptyTitle="Багц байхгүй байна"
        emptyDescription="Багц нэмэх товчийг дарж шинэ багц үүсгэнэ үү."
        actions={
          <Button size="sm" onClick={crud.handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ багц
          </Button>
        }
      >
        <DataTable columns={columns} data={bundles} />
      </AdminPageLayout>

      <Dialog open={crud.dialogOpen} onOpenChange={crud.handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {crud.editingItem ? "Багц засах" : "Шинэ багц"}
            </DialogTitle>
          </DialogHeader>
          <Form {...crud.form}>
            <form onSubmit={handleDialogSubmit} className="space-y-4">
              <FormField
                control={crud.form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нэр</FormLabel>
                    <FormControl>
                      <Input placeholder="Багцын нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тайлбар</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Багцын тайлбар"
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={crud.form.control}
                  name="discount_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хямдрал (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={crud.form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Идэвхтэй</FormLabel>
                      <FormControl>
                        <div className="flex h-10 items-center">
                          <input
                            type="checkbox"
                            checked={field.value ?? true}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Product selector */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Бүтээгдэхүүнүүд</p>
                  <span className="text-xs text-muted-foreground">
                    {selectedProductIds.length} сонгогдсон
                  </span>
                </div>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Бүтээгдэхүүн байхгүй байна
                  </p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {products.map((product) => (
                      <label
                        key={product.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="flex-1">{product.name}</span>
                        <span className="text-muted-foreground">
                          ₮{product.price_mnt.toLocaleString()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {selectedProductIds.length > 0 && (
                  <div className="space-y-1 border-t pt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Анхны үнэ:
                      </span>
                      <span>₮{totalOriginal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-green-600">
                      <span>Хямдралтай үнэ:</span>
                      <span>₮{totalDiscounted.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => crud.handleDialogOpenChange(false)}
                >
                  Цуцлах
                </Button>
                <Button
                  type="submit"
                  disabled={saveBundleMutation.isPending || crud.isMutating}
                >
                  {saveBundleMutation.isPending
                    ? "Хадгалж байна..."
                    : crud.editingItem
                      ? "Шинэчлэх"
                      : "Үүсгэх"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={crud.confirmOpen}
        onOpenChange={crud.handleConfirmOpenChange}
        title="Багц устгах"
        description={crud.confirmMessage}
        onConfirm={crud.handleConfirmDelete}
        loading={crud.confirmLoading}
      />
    </>
  );
}
