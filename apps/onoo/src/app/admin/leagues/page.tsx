"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { type LeagueRow, leaguesApi, sportsApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEntityCrud } from "@/hooks/use-entity-crud";

const leagueSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  slug: z.string().min(1, "Slug оруулна уу"),
  sport_id: z.string().min(1, "Спорт сонгоно уу"),
});

export default function LeaguesPage() {
  const { data: leagues = [], isPending } = useQuery({
    queryKey: ["admin", "leagues"],
    queryFn: () => leaguesApi.list(),
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["admin", "sports"],
    queryFn: () => sportsApi.list(),
  });

  const crud = useEntityCrud({
    api: leaguesApi,
    queryKey: ["admin", "leagues"],
    schema: leagueSchema,
    defaultValues: { name: "", slug: "", sport_id: "" },
    successMessages: {
      create: "Лиг амжилттай үүсгэлээ",
      update: "Лиг амжилттай шинэчлэлээ",
      delete: "Лиг устгагдлаа",
    },
    editMap: (row: LeagueRow) => ({
      name: row.name,
      slug: row.slug,
      sport_id: row.sport_id,
    }),
  });

  return (
    <>
      <AdminPageLayout
        title="Лигууд"
        loading={isPending}
        isEmpty={leagues.length === 0}
        emptyTitle="Лиг байхгүй байна"
        emptyDescription="Лиг нэмэх товчийг дарж шинэ лиг үүсгэнэ үү."
        actions={
          <Button size="sm" onClick={crud.handleCreate}>
            Нэмэх
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Нэр</TableHead>
              <TableHead>Спорт</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead className="w-[100px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leagues.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.sports?.name_en ?? "—"}</TableCell>
                <TableCell>
                  {new Date(row.created_at).toLocaleDateString("mn-MN")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => crud.handleEdit(row)}
                    >
                      Засах
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        crud.handleDelete(row, "Лигийг устгах уу?")
                      }
                    >
                      Устгах
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPageLayout>

      <Dialog open={crud.dialogOpen} onOpenChange={crud.handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {crud.editingItem ? "Лиг засах" : "Лиг нэмэх"}
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
                      <Input placeholder="Лигийн нэр" {...field} />
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
                      <Input placeholder="league-slug" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="sport_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Спорт</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Спорт сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sports.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name_en}
                          </SelectItem>
                        ))}
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
    </>
  );
}
