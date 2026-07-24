"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { leaguesApi, type SeasonRow, seasonsApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

const seasonSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  starts_on: z.string().optional(),
  ends_on: z.string().optional(),
});

export default function SeasonsPage() {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");

  const { data: leagues = [] } = useQuery({
    queryKey: ["admin", "leagues"],
    queryFn: () => leaguesApi.list(),
  });

  const { data: seasons = [], isPending } = useQuery({
    queryKey: ["admin", "seasons", selectedLeagueId],
    queryFn: () =>
      seasonsApi.list(
        selectedLeagueId ? { league_id: selectedLeagueId } : undefined,
      ),
    enabled: !!selectedLeagueId,
  });

  const crud = useEntityCrud({
    api: seasonsApi,
    queryKey: ["admin", "seasons"],
    schema: seasonSchema,
    defaultValues: { name: "", starts_on: "", ends_on: "" },
    successMessages: {
      create: "Улирал амжилттай үүсгэлээ",
      update: "Улирал амжилттай шинэчлэлээ",
      delete: "Улирал устгагдлаа",
    },
    editMap: (row: SeasonRow) => ({
      name: row.name,
      starts_on: row.starts_on ?? "",
      ends_on: row.ends_on ?? "",
    }),
  });

  return (
    <>
      <AdminPageLayout
        title="Улирлууд"
        loading={isPending}
        isEmpty={!!selectedLeagueId && seasons.length === 0}
        emptyTitle="Улирал байхгүй байна"
        emptyDescription="Улирал нэмэх товчийг дарж шинэ улирал үүсгэнэ үү."
        actions={
          <Button
            size="sm"
            onClick={crud.handleCreate}
            disabled={!selectedLeagueId}
          >
            Нэмэх
          </Button>
        }
        headerExtras={
          <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Лиг сонгох" />
            </SelectTrigger>
            <SelectContent>
              {leagues.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {!selectedLeagueId ? (
          <p className="text-muted-foreground text-sm">Лиг сонгоно уу</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Эхлэх</TableHead>
                <TableHead>Дуусах</TableHead>
                <TableHead className="w-[100px]">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasons.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    {row.starts_on
                      ? new Date(row.starts_on).toLocaleDateString("mn-MN")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {row.ends_on
                      ? new Date(row.ends_on).toLocaleDateString("mn-MN")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => crud.handleEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          crud.handleDelete(row, "Улирлыг устгах уу?")
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AdminPageLayout>

      <Dialog open={crud.dialogOpen} onOpenChange={crud.handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {crud.editingItem ? "Улирал засах" : "Улирал нэмэх"}
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
                      <Input placeholder="Улирлын нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="starts_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Эхлэх огноо</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={crud.form.control}
                name="ends_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дуусах огноо</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={crud.isMutating}>
                  {crud.isMutating
                    ? "Хадгалж байна…"
                    : crud.editingItem
                      ? "Шинэчлэх"
                      : "Үүсгэх"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
