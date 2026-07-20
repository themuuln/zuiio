"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import {
  type CompetitionRow,
  competitionsApi,
  seasonsApi,
} from "@/app/admin/_lib/api";
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

const COMPETITION_TYPES = [
  { value: "regular", label: "Энгийн" },
  { value: "playoff", label: "Плей-офф" },
  { value: "cup", label: "Цомын тэмцээн" },
  { value: "friendly", label: "Нөхөрсөг тоглолт" },
] as const;

const competitionSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  season_id: z.string().min(1, "Улирал сонгоно уу"),
  type: z.string().min(1, "Төрөл сонгоно уу"),
});

export default function CompetitionsPage() {
  const { data: competitions = [], isPending } = useQuery({
    queryKey: ["admin", "competitions"],
    queryFn: () => competitionsApi.list(),
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["admin", "seasons"],
    queryFn: () => seasonsApi.list(),
  });

  const crud = useEntityCrud({
    api: competitionsApi,
    queryKey: ["admin", "competitions"],
    schema: competitionSchema,
    defaultValues: { name: "", season_id: "", type: "" },
    successMessages: {
      create: "Тэмцээн амжилттай нэмэгдлээ",
      update: "Тэмцээн амжилттай шинэчлэгдлээ",
      delete: "Тэмцээн устгагдлаа",
    },
    editMap: (row: CompetitionRow) => ({
      name: row.name,
      season_id: row.season_id,
      type: row.type,
    }),
  });

  return (
    <>
      <AdminPageLayout
        title="Тэмцээнүүд"
        loading={isPending}
        isEmpty={competitions.length === 0}
        emptyTitle="Тэмцээн байхгүй байна"
        emptyDescription="Тэмцээн нэмэх товчийг дарж шинэ тэмцээн үүсгэнэ үү."
        actions={
          <Button onClick={crud.handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Нэмэх
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Нэр</TableHead>
              <TableHead>Улирал</TableHead>
              <TableHead>Төрөл</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead className="w-[100px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitions.map((row) => {
              const season = seasons.find((s) => s.id === row.season_id);
              const typeLabel =
                COMPETITION_TYPES.find((t) => t.value === row.type)?.label ??
                row.type;
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{season?.name ?? "—"}</TableCell>
                  <TableCell>{typeLabel}</TableCell>
                  <TableCell>
                    {new Date(row.created_at).toLocaleDateString("mn-MN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => crud.handleEdit(row)}
                        aria-label={`${row.name} засах`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          crud.handleDelete(
                            row,
                            `"${row.name}" тэмцээнийг устгах уу?`,
                          )
                        }
                        aria-label={`${row.name} устгах`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminPageLayout>

      <Dialog open={crud.dialogOpen} onOpenChange={crud.handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {crud.editingItem ? "Тэмцээн засах" : "Тэмцээн нэмэх"}
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
                      <Input placeholder="Тэмцээний нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Улирал</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Улирал сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {seasons.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Төрөл</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Төрөл сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPETITION_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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
