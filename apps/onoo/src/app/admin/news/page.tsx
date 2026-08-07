"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import type { NewsRow } from "@/app/admin/_lib/api-news";
import { newsApi } from "@/app/admin/_lib/api-news";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEntityCrud } from "@/hooks/use-entity-crud";

const newsSchema = z.object({
  title: z
    .string()
    .min(1, "Гарчиг заавал байх ёстой")
    .max(200, "Гарчиг хэт урт байна"),
  excerpt: z.string().max(500, "Товч агуулга хэт урт байна").optional(),
  body: z.string().min(1, "Агуулга заавал байх ёстой"),
  cover_image_url: z
    .string()
    .url("Зургийн URL буруу байна")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published"]),
});

const dateFormatter = new Intl.DateTimeFormat("mn-MN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default function AdminNewsPage() {
  const { data: articles = [], isPending } = useQuery({
    queryKey: ["admin", "news"],
    queryFn: () => newsApi.list(),
  });

  const crud = useEntityCrud({
    api: newsApi,
    queryKey: ["admin", "news"],
    schema: newsSchema,
    defaultValues: {
      title: "",
      excerpt: "",
      body: "",
      cover_image_url: "",
      status: "draft",
    },
    successMessages: {
      create: "Мэдээ амжилттай нийтлэгдлээ",
      update: "Мэдээ амжилттай шинэчлэгдлээ",
      delete: "Мэдээ устгагдлаа",
    },
    editMap: (row: NewsRow) => ({
      title: row.title,
      excerpt: row.excerpt ?? "",
      body: row.body,
      cover_image_url: row.cover_image_url ?? "",
      status: row.status,
    }),
  });

  const columns: ColumnDef<NewsRow>[] = [
    {
      accessorKey: "title",
      header: "Гарчиг",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "excerpt",
      header: "Товч агуулга",
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[280px] truncate">
          {row.original.excerpt || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ row }) =>
        row.original.published ? (
          <Badge>Нийтэлсэн</Badge>
        ) : (
          <Badge variant="secondary">Ноорог</Badge>
        ),
    },
    {
      accessorKey: "published_at",
      header: "Нийтэлсэн огноо",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.published_at
            ? dateFormatter.format(new Date(row.original.published_at))
            : "—"}
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
            onClick={() => crud.handleDelete(row.original, "Мэдээг устгах уу?")}
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
        title="Мэдээ"
        loading={isPending}
        isEmpty={articles.length === 0}
        emptyTitle="Мэдээ байхгүй байна"
        emptyDescription="Мэдээ нэмэх товчийг дарж шинэ мэдээ үүсгэнэ үү."
        actions={
          <Button size="sm" onClick={crud.handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ мэдээ
          </Button>
        }
      >
        <DataTable columns={columns} data={articles} />
      </AdminPageLayout>

      <Dialog open={crud.dialogOpen} onOpenChange={crud.handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {crud.editingItem ? "Мэдээ засах" : "Шинэ мэдээ"}
            </DialogTitle>
          </DialogHeader>
          <Form {...crud.form}>
            <form
              onSubmit={crud.form.handleSubmit(crud.handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={crud.form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Гарчиг</FormLabel>
                    <FormControl>
                      <Input placeholder="Мэдээний гарчиг" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Товч агуулга</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Мэдээний товч агуулга (жагсаалтад харагдана)"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Агуулга (Markdown)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Мэдээний бүрэн агуулга..."
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="cover_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Зургийн URL (заавал биш)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Статус сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Ноорог</SelectItem>
                        <SelectItem value="published">Нийтэлсэн</SelectItem>
                      </SelectContent>
                    </Select>
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
        title="Мэдээ устгах"
        description={crud.confirmMessage}
        onConfirm={crud.handleConfirmDelete}
        loading={crud.confirmLoading}
      />
    </>
  );
}
