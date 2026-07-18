"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { type LeagueRow, leaguesApi, sportsApi } from "../_lib/api";

const ORG_ID = "b0000000-0000-0000-0000-000000000001";

const leagueSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  slug: z.string().min(1, "Slug оруулна уу"),
  sport_id: z.string().min(1, "Спорт сонгоно уу"),
});

type LeagueFormValues = z.infer<typeof leagueSchema>;

export default function LeaguesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeagueRow | null>(null);

  const { data: leagues = [], isPending } = useQuery({
    queryKey: ["admin", "leagues"],
    queryFn: leaguesApi.list,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["admin", "sports"],
    queryFn: sportsApi.list,
  });

  const form = useForm<LeagueFormValues>({
    resolver: zodResolver(leagueSchema),
    defaultValues: { name: "", slug: "", sport_id: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: LeagueFormValues) =>
      leaguesApi.create({ ...data, organization_id: ORG_ID }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leagues"] });
      toast.success("Лиг амжилттай үүсгэлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: LeagueFormValues & { id: string }) =>
      leaguesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leagues"] });
      toast.success("Лиг амжилттай шинэчлэлээ");
      setDialogOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leaguesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leagues"] });
      toast.success("Лиг устгагдлаа");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", slug: "", sport_id: "" });
    setDialogOpen(true);
  }

  function openEdit(row: LeagueRow) {
    setEditing(row);
    form.reset({ name: row.name, slug: row.slug, sport_id: row.sport_id });
    setDialogOpen(true);
  }

  function onSubmit(values: LeagueFormValues) {
    if (editing) {
      updateMutation.mutate({ ...values, id: editing.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleDelete(id: string) {
    if (!window.confirm("Лигийг устгах уу?")) return;
    deleteMutation.mutate(id);
  }

  const isPendingMutation =
    createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Лигууд</CardTitle>
          <Button size="sm" onClick={openCreate}>
            Нэмэх
          </Button>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground text-sm">Ачаалж байна…</p>
          ) : (
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
                          onClick={() => openEdit(row)}
                        >
                          Засах
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(row.id)}
                        >
                          Устгах
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {leagues.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Лиг байхгүй байна
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Лиг засах" : "Лиг нэмэх"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
              <DialogFooter>
                <Button type="submit" disabled={isPendingMutation}>
                  {isPendingMutation
                    ? "Хадгалж байна…"
                    : editing
                      ? "Шинэчлэх"
                      : "Үүсгэх"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
