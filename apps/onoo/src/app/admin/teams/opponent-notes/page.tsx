"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type OpponentNoteRow,
  opponentNotesApi,
} from "@/app/admin/_lib/api-team-ops";
import { teamsContextApi, type TeamSeasonRow } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const createNoteSchema = z.object({
  team_season_id: z.string().min(1, "Баг сонгоно уу"),
  opponent_team_season_id: z.string().min(1, "Өрсөлдөгч баг сонгоно уу"),
  notes: z.string().optional(),
  game_plan: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
});

type CreateNoteFormValues = z.infer<typeof createNoteSchema>;

const editNoteSchema = z.object({
  notes: z.string().optional(),
  game_plan: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
});

type EditNoteFormValues = z.infer<typeof editNoteSchema>;

export default function OpponentNotesPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<OpponentNoteRow | null>(null);

  const { data: notes = [], isPending: notesPending } = useQuery({
    queryKey: ["admin", "opponent-notes"],
    queryFn: () => opponentNotesApi.list(),
  });

  const { data: ctx } = useQuery({
    queryKey: ["admin", "teams", "context"],
    queryFn: () => teamsContextApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const teamSeasons = (ctx?.teamSeasons ?? []) as TeamSeasonRow[]

  const createForm = useForm<CreateNoteFormValues>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      team_season_id: "",
      opponent_team_season_id: "",
      notes: "",
      game_plan: "",
      strengths: "",
      weaknesses: "",
    },
  });

  const editForm = useForm<EditNoteFormValues>({
    resolver: zodResolver(editNoteSchema),
    defaultValues: {
      notes: "",
      game_plan: "",
      strengths: "",
      weaknesses: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateNoteFormValues) => {
      const strengths = data.strengths
        ? data.strengths.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const weaknesses = data.weaknesses
        ? data.weaknesses.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      return opponentNotesApi.create({
        team_season_id: data.team_season_id,
        opponent_team_season_id: data.opponent_team_season_id,
        notes: data.notes || undefined,
        game_plan: data.game_plan || undefined,
        strengths: strengths.length > 0 ? strengths : undefined,
        weaknesses: weaknesses.length > 0 ? weaknesses : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "opponent-notes"] });
      toast.success("Тэмдэглэл амжилттай нэмэгдлээ");
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: EditNoteFormValues;
    }) => {
      const strengths = data.strengths
        ? data.strengths.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      const weaknesses = data.weaknesses
        ? data.weaknesses.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      return opponentNotesApi.update(id, {
        notes: data.notes || undefined,
        game_plan: data.game_plan || undefined,
        strengths,
        weaknesses,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "opponent-notes"] });
      toast.success("Тэмдэглэл амжилттай шинэчлэгдлээ");
      setEditDialogOpen(false);
      setEditingNote(null);
      editForm.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleCreateSubmit(values: CreateNoteFormValues) {
    createMutation.mutate(values);
  }

  function handleEditClick(note: OpponentNoteRow) {
    setEditingNote(note);
    editForm.reset({
      notes: note.notes ?? "",
      game_plan: note.game_plan ?? "",
      strengths: note.strengths?.join(", ") ?? "",
      weaknesses: note.weaknesses?.join(", ") ?? "",
    });
    setEditDialogOpen(true);
  }

  function handleEditSubmit(values: EditNoteFormValues) {
    if (!editingNote) return;
    updateMutation.mutate({ id: editingNote.id, data: values });
  }

  const opponentTeamSeasons = teamSeasons.filter(
    (ts) => ts.id !== createForm.watch("team_season_id"),
  );

  return (
    <>
      <AdminPageLayout
        title="Өрсөлдөгчийн тэмдэглэл"
        loading={notesPending}
        isEmpty={notes.length === 0}
        emptyTitle="Тэмдэглэл олдсонгүй"
        emptyDescription="Тэмдэглэл нэмэх товчийг дарж өрсөлдөгчийн тухай мэдээлэл оруулна уу."
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Нэмэх
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => {
            const myTeam = note.team_seasons?.teams?.name ?? "—";
            const oppTeam = note.opponent_team?.teams?.name ?? "—";
            return (
              <Card key={note.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{oppTeam}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(note)}
                    aria-label="Засах"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-muted-foreground text-xs">
                    {myTeam} → {oppTeam}
                  </div>
                  {note.notes && (
                    <div>
                      <span className="font-medium">Тэмдэглэл:</span>{" "}
                      <span className="text-muted-foreground">{note.notes}</span>
                    </div>
                  )}
                  {note.game_plan && (
                    <div>
                      <span className="font-medium">Тоглолтын төлөвлөгөө:</span>{" "}
                      <span className="text-muted-foreground">
                        {note.game_plan}
                      </span>
                    </div>
                  )}
                  {note.strengths && note.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="font-medium">Давуу тал:</span>
                      {note.strengths.map((s, i) => (
                        <Badge key={i} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {note.weaknesses && note.weaknesses.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="font-medium">Сул тал:</span>
                      {note.weaknesses.map((w, i) => (
                        <Badge key={i} variant="outline">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-muted-foreground text-xs pt-2">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </AdminPageLayout>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ тэмдэглэл нэмэх</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(handleCreateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="team_season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Миний баг</FormLabel>
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
                control={createForm.control}
                name="opponent_team_season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Өрсөлдөгч баг</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Өрсөлдөгч сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {opponentTeamSeasons.map((ts) => (
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
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тэмдэглэл</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ерөнхий тэмдэглэл"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="game_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тоглолтын төлөвлөгөө</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Тоглолтын төлөвлөгөө"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="strengths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Давуу талууд</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Тасалбар, хурдан довтолгоо (таслалаар тусгаарлана)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="weaknesses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сул талууд</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Хамгаалалт, холын шидэлт (таслалаар тусгаарлана)"
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
                  onClick={() => setCreateDialogOpen(false)}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Тэмдэглэл засах —{" "}
              {editingNote?.opponent_team?.teams?.name ?? "—"}
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тэмдэглэл</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="game_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тоглолтын төлөвлөгөө</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="strengths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Давуу талууд</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Таслалаар тусгаарлана"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="weaknesses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сул талууд</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Таслалаар тусгаарлана"
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
                  onClick={() => setEditDialogOpen(false)}
                >
                  Цуцлах
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
