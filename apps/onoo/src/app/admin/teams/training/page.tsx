"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type TeamSeasonRow, teamsContextApi } from "@/app/admin/_lib/api";
import { trainingApi } from "@/app/admin/_lib/api-team-ops";
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
import { Textarea } from "@/components/ui/textarea";

const trainingSchema = z.object({
  team_season_id: z.string().min(1, "Баг заавал байх ёстой"),
  title: z.string().min(1, "Гарчиг заавал байх ёстой"),
  description: z.string().optional(),
  location: z.string().optional(),
  scheduled_at: z.string().min(1, "Цаг заавал байх ёстой"),
  duration_minutes: z.coerce.number().int().min(1, "Хугацаа заавал байх ёстой"),
});

interface TrainingFormValues {
  team_season_id: string;
  title: string;
  description?: string;
  location?: string;
  scheduled_at: string;
  duration_minutes: number;
}
export default function TrainingPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({ open: false, id: "", title: "" });

  const { data: sessions = [], isPending: sessionsPending } = useQuery({
    queryKey: ["admin", "training-sessions"],
    queryFn: () => trainingApi.list(),
  });

  const { data: ctx } = useQuery({
    queryKey: ["admin", "teams", "context"],
    queryFn: () => teamsContextApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const teamSeasons = (ctx?.teamSeasons ?? []) as TeamSeasonRow[];

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingSchema) as never,
    defaultValues: {
      team_season_id: "",
      title: "",
      description: "",
      location: "",
      scheduled_at: "",
      duration_minutes: 90,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TrainingFormValues) => trainingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "training-sessions"],
      });
      toast.success("Сургуулилт амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trainingApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "training-sessions"],
      });
      toast.success("Сургуулилт устгагдлаа");
      setDeleteConfirm({ open: false, id: "", title: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(values: TrainingFormValues) {
    createMutation.mutate(values);
  }

  return (
    <>
      <AdminPageLayout
        title="Сургуулилтын хуваарь"
        loading={sessionsPending}
        isEmpty={sessions.length === 0}
        emptyTitle="Сургуулилт олдсонгүй"
        emptyDescription="Сургуулилт нэмэх товчийг дарж шинэ сургуулилт үүсгэнэ үү."
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
              <TableHead>Гарчиг</TableHead>
              <TableHead>Баг</TableHead>
              <TableHead>Байршил</TableHead>
              <TableHead>Цаг</TableHead>
              <TableHead>Хугацаа</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead className="w-[80px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session, index) => (
              <TableRow key={session.id}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">{session.title}</TableCell>
                <TableCell>
                  {session.team_seasons?.teams?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {session.location ?? "—"}
                </TableCell>
                <TableCell>
                  {new Date(session.scheduled_at).toLocaleString()}
                </TableCell>
                <TableCell>{session.duration_minutes} мин</TableCell>
                <TableCell>
                  <Badge
                    variant={session.is_cancelled ? "destructive" : "default"}
                  >
                    {session.is_cancelled ? "Цуцлагдсан" : "Төлөвлөгдсөн"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(session.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setDeleteConfirm({
                        open: true,
                        id: session.id,
                        title: session.title,
                      })
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
            <DialogTitle>Шинэ сургуулилт нэмэх</DialogTitle>
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
                          <SelectValue placeholder="Баг сонгох" />
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Гарчиг</FormLabel>
                    <FormControl>
                      <Input placeholder="Сургуулилтын нэр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тайлбар</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Сургуулилтын тайлбар" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Байршил</FormLabel>
                    <FormControl>
                      <Input placeholder="Талбай, заал" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduled_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Эхлэх цаг</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Хугацаа (минут)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="90"
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
        title="Сургуулилт устгах"
        description={`"${deleteConfirm.title}" сургуулилтыг устгах уу?`}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
