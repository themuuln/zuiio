"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { type VenueRow, venuesApi } from "@/app/admin/_lib/api";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEntityCrud } from "@/hooks/use-entity-crud";

const venueSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  city: z.string().optional(),
  capacity: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
});

export default function VenuesPage() {
  const { data: venues = [], isPending } = useQuery({
    queryKey: ["admin", "venues"],
    queryFn: () => venuesApi.list(),
  });

  const crud = useEntityCrud({
    api: venuesApi,
    queryKey: ["admin", "venues"],
    schema: venueSchema,
    defaultValues: { name: "", city: "", capacity: "" },
    successMessages: {
      create: "Талбай амжилттай нэмэгдлээ",
      update: "Талбай амжилттай шинэчлэгдлээ",
      delete: "Талбай устгагдлаа",
    },
    editMap: (row: VenueRow) => ({
      name: row.name,
      city: row.city ?? "",
      capacity: row.capacity ?? "",
    }),
  });

  return (
    <>
      <AdminPageLayout
        title="Талбайнууд"
        loading={isPending}
        isEmpty={venues.length === 0}
        emptyTitle="Талбай байхгүй байна"
        emptyDescription="Талбай нэмэх товчийг дарж шинэ талбай үүсгэнэ үү."
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
              <TableHead>Хот</TableHead>
              <TableHead>Багтаамж</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead className="w-[100px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.city ?? "—"}</TableCell>
                <TableCell>{row.capacity ?? "—"}</TableCell>
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
                          `"${row.name}" талбайг устгах уу?`,
                        )
                      }
                      aria-label={`${row.name} устгах`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
              {crud.editingItem ? "Талбай засах" : "Талбай нэмэх"}
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
                      <Input placeholder="Талбайн нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Хот</FormLabel>
                    <FormControl>
                      <Input placeholder="Жнь: Улаанбаатар" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Багтаамж</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Жнь: 10000"
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
    </>
  );
}
