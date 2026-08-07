"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { playersApi, teamSeasonsApi, transfersApi } from "@/app/admin/_lib/api";
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

const TRANSFER_TYPE_LABELS: Record<string, string> = {
  permanent: "Байнган",
  loan: "Зээл",
  free_transfer: "Чөлөөт",
  trade: "Солилцоо",
};

const TRANSFER_TYPES = Object.keys(TRANSFER_TYPE_LABELS);

const formSchema = z.object({
  player_id: z.string().min(1, "Тоглогч заавал сонгох"),
  from_team_season_id: z.string().optional(),
  to_team_season_id: z.string().min(1, "Очих баг заавал сонгох"),
  transfer_type: z.string().min(1, "Шилжилтийн төрөл заавал сонгох"),
  effective_from: z.string().min(1, "Эхлэх огноо заавал оруулах"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ["admin", "players"],
    queryFn: () => playersApi.list(),
  });

  const { data: teamSeasons = [] } = useQuery({
    queryKey: ["admin", "team-seasons"],
    queryFn: () => teamSeasonsApi.list(),
  });

  const { data: transfers = [], isPending } = useQuery({
    queryKey: ["admin", "transfers"],
    queryFn: () => transfersApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => transfersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transfers"] });
      toast.success("Шилжилт амжилттай үүсгэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      player_id: "",
      from_team_season_id: "",
      to_team_season_id: "",
      transfer_type: "",
      effective_from: "",
      note: "",
    },
  });

  function onSubmit(values: FormValues) {
    createMutation.mutate({
      player_id: values.player_id,
      from_team_season_id: values.from_team_season_id || null,
      to_team_season_id: values.to_team_season_id,
      transfer_type: values.transfer_type,
      effective_from: values.effective_from,
      note: values.note || null,
    });
  }

  return (
    <>
      <AdminPageLayout
        title="Шилжилтүүд"
        loading={isPending}
        isEmpty={transfers.length === 0}
        emptyTitle="Шилжилт олдсонгүй"
        emptyDescription="Шинэ шилжилт нэмэх товчийг дарж шилжилт үүсгэнэ үү."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ шилжилт
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тоглогч</TableHead>
              <TableHead>Гарсан баг</TableHead>
              <TableHead>Очих баг</TableHead>
              <TableHead>Төрөл</TableHead>
              <TableHead>Эхлэх огноо</TableHead>
              <TableHead>Тэмдэглэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  {t.players?.canonical_name ?? t.player_id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.teams_from?.teams?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.teams_to?.teams?.name ?? t.to_team_season_id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {TRANSFER_TYPE_LABELS[t.transfer_type] ?? t.transfer_type}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(t.effective_from).toLocaleDateString()}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                  {t.note ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPageLayout>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ шилжилт нэмэх</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="player_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тоглогч</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Тоглогч сонгох">
                            {
                              players?.find((p) => p.id === field.value)
                                ?.canonical_name
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {players.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.canonical_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="from_team_season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Гарсан баг</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Баг сонгох (заавал биш)">
                            {
                              teamSeasons?.find((ts) => ts.id === field.value)
                                ?.teams?.name
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamSeasons.map((ts) => (
                          <SelectItem key={ts.id} value={ts.id}>
                            {ts.teams?.name ?? ts.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to_team_season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Очих баг</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Очих баг сонгох">
                            {
                              teamSeasons?.find((ts) => ts.id === field.value)
                                ?.teams?.name
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamSeasons.map((ts) => (
                          <SelectItem key={ts.id} value={ts.id}>
                            {ts.teams?.name ?? ts.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transfer_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Шилжилтийн төрөл</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Төрөл сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRANSFER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {TRANSFER_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effective_from"
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
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тэмдэглэл</FormLabel>
                    <FormControl>
                      <Input placeholder="Тэмдэглэл (заавал биш)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Цуцлах
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Үүсгэж байна..." : "Үүсгэх"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
