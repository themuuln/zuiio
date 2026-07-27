"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import type { ShopProductRow } from "@/app/admin/_lib/api";
import { shopProductsApi } from "@/app/admin/_lib/api";
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

const productSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  slug: z.string().min(1, "Slug шаардлагатай"),
  price_mnt: z.coerce.number().int().positive("Үнэ эерэг тоо байх ёстой"),
  description: z.string().optional(),
  variants: z.string().optional(),
});

const dateFormatter = new Intl.DateTimeFormat("mn-MN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default function AdminProductsPage() {
  const { data: products = [], isPending } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => shopProductsApi.list(),
  });

  const crud = useEntityCrud({
    api: shopProductsApi,
    queryKey: ["admin", "products"],
    schema: productSchema,
    defaultValues: {
      name: "",
      slug: "",
      price_mnt: "",
      description: "",
      variants: "[]",
    },
    successMessages: {
      create: "Бүтээгдэхүүн амжилттай үүсгэлээ",
      update: "Бүтээгдэхүүн амжилттай шинэчлэлээ",
      delete: "Бүтээгдэхүүн устгагдлаа",
    },
    editMap: (row: ShopProductRow) => ({
      name: row.name,
      slug: row.slug,
      price_mnt: row.price_mnt,
      description: row.description ?? "",
      variants: JSON.stringify(row.variants),
    }),
  });

  const [variants, setVariants] = useState<
    Array<{ size: string; stock: number }>
  >([]);

  // Sync local variant state from form value when dialog opens
  useEffect(() => {
    const v = crud.form.getValues("variants");
    if (typeof v === "string" && v) {
      try {
        setVariants(JSON.parse(v));
      } catch {
        setVariants([]);
      }
    }
  }, [crud.form.getValues]);
  useEffect(() => {
    const v = crud.form.getValues("variants");
    if (typeof v === "string" && v) {
      try {
        setVariants(JSON.parse(v));
      } catch {
        setVariants([]);
      }
    }
  }, [crud.form.getValues]);
  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(
    index: number,
    field: "size" | "stock",
    value: string | number,
  ) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? { ...v, [field]: field === "stock" ? Number(value) : value }
          : v,
      ),
    );
  }
  function addVariant() {
    setVariants((prev) => [...prev, { size: "", stock: 0 }]);
  }

  const columns: ColumnDef<ShopProductRow>[] = [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.slug}</span>
      ),
    },
    {
      accessorKey: "price_mnt",
      header: "Үнэ",
      cell: ({ row }) => (
        <span className="font-medium">
          ₮{row.original.price_mnt.toLocaleString()}
        </span>
      ),
    },
    {
      id: "variants",
      header: "Хэмжээ / үлдэгдэл",
      cell: ({ row }) => {
        const vars = row.original.variants ?? [];
        if (vars.length === 0)
          return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {vars.map((v) => (
              <Badge
                key={v.size}
                variant={v.stock > 0 ? "outline" : "secondary"}
                className="text-xs"
              >
                {v.size}: {v.stock}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "is_available",
      header: "Статус",
      cell: ({ row }) => (
        <Badge variant={row.original.is_available ? "default" : "secondary"}>
          {row.original.is_available ? "Зарах боломжтой" : "Дууссан"}
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
              crud.handleDelete(row.original, "Бүтээгдэхүүнийг устгах уу?")
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
        title="Бүтээгдэхүүн"
        loading={isPending}
        isEmpty={products.length === 0}
        emptyTitle="Бүтээгдэхүүн байхгүй байна"
        emptyDescription="Бүтээгдэхүүн нэмэх товчийг дарж шинэ бүтээгдэхүүн үүсгэнэ үү."
        actions={
          <Button size="sm" onClick={crud.handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ бүтээгдэхүүн
          </Button>
        }
      >
        <DataTable columns={columns} data={products} />
      </AdminPageLayout>

      <Dialog open={crud.dialogOpen} onOpenChange={crud.handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {crud.editingItem ? "Бүтээгдэхүүн засах" : "Шинэ бүтээгдэхүүн"}
            </DialogTitle>
          </DialogHeader>
          <Form {...crud.form}>
            <form
              onSubmit={crud.form.handleSubmit(crud.handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={crud.form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нэр</FormLabel>
                    <FormControl>
                      <Input placeholder="Бүтээгдэхүүний нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="product-slug" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="price_mnt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Үнэ (₮)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10000" {...field} />
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
                        placeholder="Бүтээгдэхүүний тайлбар"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variant editor */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Хэмжээ / нөөц</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Нэмэх
                  </Button>
                </div>
                {variants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Бүтээгдэхүүнд хэмжээ нэмээгүй байна. Жижиг, дунд, том гэх
                    мэт.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static list, no reordering
                      <div key={i} className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-muted-foreground">
                            Хэмжээ
                          </label>
                          <Input
                            placeholder="S, M, L"
                            value={v.size}
                            onChange={(e) =>
                              updateVariant(i, "size", e.target.value)
                            }
                          />
                        </div>
                        <div className="w-20">
                          <label className="mb-1 block text-xs text-muted-foreground">
                            Нөөц
                          </label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={v.stock}
                            onChange={(e) =>
                              updateVariant(i, "stock", e.target.value)
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0 text-destructive"
                          onClick={() => removeVariant(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => crud.handleDialogOpenChange(false)}
                >
                  Цуцлах
                </Button>
                <Button type="submit" disabled={crud.isMutating}>
                  {crud.isMutating
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
        title="Бүтээгдэхүүн устгах"
        description={crud.confirmMessage}
        onConfirm={crud.handleConfirmDelete}
        loading={crud.confirmLoading}
      />
    </>
  );
}
