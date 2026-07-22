"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import type { ShopProductRow } from "@/app/admin/_lib/api";
import { shopProductsApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
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
    defaultValues: { name: "", slug: "", price_mnt: "", description: "" },
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
    }),
  });

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
      header: "Хэмжээ",
      cell: ({ row }) => `${row.original.variants?.length ?? 0} хэмжээтэй`,
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
              crud.handleDelete(
                row.original,
                "Бүтээгдэхүүнийг устгах уу?",
              )
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

      <Dialog
        open={crud.dialogOpen}
        onOpenChange={crud.handleDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {crud.editingItem
                ? "Бүтээгдэхүүн засах"
                : "Шинэ бүтээгдэхүүн"}
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
                      <Input
                        type="number"
                        placeholder="10000"
                        {...field}
                      />
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
              <div className="flex justify-end gap-2">
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
