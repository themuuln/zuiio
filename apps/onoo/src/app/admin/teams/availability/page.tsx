"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type PlayerRow,
  type TeamSeasonRow,
  teamsContextApi,
} from "@/app/admin/_lib/api";
import { availabilityApi } from "@/app/admin/_lib/api-team-ops";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
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

const availabilitySchema = z.object({
  team_season_id: z.string().min(1, "Баг сонгоно уу"),
  player_id: z.string().min(1, "Тоглогч сонгоно уу"),
  game_date: z.string().min(1, "Огноо оруулна уу"),
  status: z.string().min(1, "Статус сонгоно уу"),
  note: z.string().optional(),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

const STATUS_LABELS: Record<string, string> = {
  available: "Боломжтой",
  unavailable: "Боломжгүй",
  maybe: "Магадгүй",
  injured: "Гэмтэлтэй",
};

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  available: "default",
  unavailable: "destructive",
  maybe: "secondary",
  injured: "outline",
};

const STATUSES = Object.keys(STATUS_LABELS);

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
  }>({ open: false, id: "" });

  const { data: availability = [], isPending: availPending } = useQuery({
    queryKey: ["admin", "roster-availability"],
    queryFn: () => availabilityApi.list(),
  });

  const { data: ctx } = useQuery({
    queryKey: ["admin", "teams", "context"],
    queryFn: () => teamsContextApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const teamSeasons = (ctx?.teamSeasons ?? []) as TeamSeasonRow[];
  const players = (ctx?.players ?? []) as PlayerRow[];

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      team_season_id: "",
      player_id: "",
      game_date: "",
      status: "",
      note: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AvailabilityFormValues) => availabilityApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "roster-availability"],
      });
      toast.success("Бэлэн байдал амжилттай бүртгэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => availabilityApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "roster-availability"],
      });
      toast.success("Бүртгэл устгагдлаа");
      setDeleteConfirm({ open: false, id: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(values: AvailabilityFormValues) {
    createMutation.mutate(values);
  }

  return (
    <>
      <AdminPageLayout
        title="Тоглогчдын бэлэн байдал"
        loading={availPending}
        isEmpty={availability.length === 0}
        emptyTitle="Бүртгэл олдсонгүй"
        emptyDescription="Тоглогчийн бэлэн байдлыг бүртгэх товчийг дарж шинэ мэдээлэл оруулна уу."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Нэмэх
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Тоглогч</TableHead>
              <TableHead>Тоглолтын огноо</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Тэмдэглэл</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead className="w-[80px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availability.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">
                  {item.players?.canonical_name ?? item.player_id.slice(0, 8)}
                </TableCell>
                <TableCell>{item.game_date}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[item.status] ?? "outline"}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                  {item.note ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setDeleteConfirm({ open: true, id: item.id })
                    }
                    aria-label="Устгах"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPageLayout>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Бэлэн байдал бүртгэх</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="team_season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Баг</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Баг сонгох">
                            {
                              teamSeasons.find((ts) => ts.id === field.value)
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
                name="player_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тоглогч</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Тоглогч сонгох">
                            {
                              players.find((p) => p.id === field.value)
                                ?.canonical_name
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {players.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.canonical_name ?? p.id.slice(0, 8)}
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
                name="game_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тоглолтын огноо</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Статус сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
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
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тэмдэглэл</FormLabel>
                    <FormControl>
                      <Input placeholder="Нэмэлт тэмдэглэл" {...field} />
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
                  {createMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        title="Бүртгэл устгах"
        description="Энэ бэлэн байдлын бүртгэлийг устгах уу?"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
