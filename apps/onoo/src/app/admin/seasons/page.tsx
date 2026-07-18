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
import { leaguesApi, type SeasonRow, seasonsApi } from "../_lib/api";

const seasonSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  starts_on: z.string().optional(),
  ends_on: z.string().optional(),
});

type SeasonFormValues = z.infer<typeof seasonSchema>;

export default function SeasonsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SeasonRow | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");

  const { data: leagues = [] } = useQuery({
    queryKey: ["admin", "leagues"],
    queryFn: leaguesApi.list,
  });

  const { data: seasons = [], isPending } = useQuery({
    queryKey: ["admin", "seasons", selectedLeagueId],
    queryFn: () => seasonsApi.list(selectedLeagueId),
    enabled: !!selectedLeagueId,
  });

  const form = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { name: "", starts_on: "", ends_on: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: SeasonFormValues) =>
      seasonsApi.create({ ...data, league_id: selectedLeagueId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "seasons"] });
      toast.success("Улирал амжилттай үүсгэлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: SeasonFormValues & { id: string }) =>
      seasonsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "seasons"] });
      toast.success("Улирал амжилттай шинэчлэлээ");
      setDialogOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => seasonsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "seasons"] });
      toast.success("Улирал устгагдлаа");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", starts_on: "", ends_on: "" });
    setDialogOpen(true);
  }

  function openEdit(row: SeasonRow) {
    setEditing(row);
    form.reset({
      name: row.name,
      starts_on: row.starts_on ?? "",
      ends_on: row.ends_on ?? "",
    });
    setDialogOpen(true);
  }

  function onSubmit(values: SeasonFormValues) {
    if (editing) {
      updateMutation.mutate({ ...values, id: editing.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleDelete(id: string) {
    if (!window.confirm("Улирлыг устгах уу?")) return;
    deleteMutation.mutate(id);
  }

  const isPendingMutation =
    createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Улирлууд</CardTitle>
          <Button size="sm" onClick={openCreate} disabled={!selectedLeagueId}>
            Нэмэх
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {!selectedLeagueId ? (
            <p className="text-muted-foreground text-sm">Лиг сонгоно уу</p>
          ) : isPending ? (
            <p className="text-muted-foreground text-sm">Ачаалж байна…</p>
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
                {seasons.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Улирал байхгүй байна
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
            <DialogTitle>
              {editing ? "Улирал засах" : "Улирал нэмэх"}
            </DialogTitle>
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
                      <Input placeholder="Улирлын нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                control={form.control}
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
