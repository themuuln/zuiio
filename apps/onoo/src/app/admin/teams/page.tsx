"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { leaguesApi, type TeamRow, teamsApi } from "@/app/admin/_lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const teamSchema = z.object({
  name: z.string().min(1, "Нэр заавал байх ёстой"),
  short_code: z.string().min(1, "Товчлол заавал байх ёстой"),
  slug: z.string().min(1, "Slug заавал байх ёстой"),
  primary_color: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null);

  const { data: leagues = [] } = useQuery({
    queryKey: ["admin", "leagues"],
    queryFn: leaguesApi.list,
  });

  const effectiveLeagueId = leagueFilter === "all" ? undefined : leagueFilter;

  const { data: teams = [], isPending: teamsPending } = useQuery({
    queryKey: ["admin", "teams", effectiveLeagueId],
    queryFn: () => teamsApi.list(effectiveLeagueId),
  });

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      short_code: "",
      slug: "",
      primary_color: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TeamFormValues) =>
      teamsApi.create({
        league_id:
          leagueFilter === "all" ? (leagues[0]?.id ?? "") : leagueFilter,
        name: data.name,
        short_code: data.short_code,
        slug: data.slug,
        primary_color: data.primary_color || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      toast.success("Баг амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: TeamFormValues & { id: string }) =>
      teamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      toast.success("Баг амжилттай шинэчлэгдлээ");
      setDialogOpen(false);
      setEditingTeam(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      toast.success("Баг устгагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleEdit(team: TeamRow) {
    setEditingTeam(team);
    form.reset({
      name: team.name,
      short_code: team.short_code,
      slug: team.slug,
      primary_color: team.primary_color ?? "",
    });
    setDialogOpen(true);
  }

  function handleSubmit(values: TeamFormValues) {
    if (editingTeam) {
      updateMutation.mutate({ ...values, id: editingTeam.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingTeam(null);
      form.reset();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-2xl font-bold">Багууд</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-[200px]" aria-label="Лиг сонгох">
                <SelectValue placeholder="Бүх лиг" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх лиг</SelectItem>
                {leagues.map((league) => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Нэмэх
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTeam ? "Баг засах" : "Шинэ баг нэмэх"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Нэр</FormLabel>
                          <FormControl>
                            <Input placeholder="Багийн нэр" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="short_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Товчлол</FormLabel>
                          <FormControl>
                            <Input placeholder="Жнь: ХАС" {...field} />
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
                            <Input placeholder="Жнь: khas" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Өнгө</FormLabel>
                          <FormControl>
                            <input
                              type="color"
                              className="h-10 w-20 cursor-pointer rounded border"
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
                        onClick={() => handleDialogOpenChange(false)}
                      >
                        Цуцлах
                      </Button>
                      <Button type="submit" disabled={isMutating}>
                        {isMutating ? "Хадгалж байна..." : "Хадгалах"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamsPending ? (
            <div className="py-8 text-center text-muted-foreground">
              Ачаалж байна...
            </div>
          ) : teams.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Баг олдсонгүй
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Товчлол</TableHead>
                  <TableHead>Өнгө</TableHead>
                  <TableHead>Лиг</TableHead>
                  <TableHead className="w-[100px]">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.short_code}</TableCell>
                    <TableCell>
                      <div
                        className="h-4 w-4 rounded-full border"
                        style={{
                          backgroundColor: team.primary_color ?? undefined,
                        }}
                        role="img"
                        aria-label={
                          team.primary_color
                            ? `Өнгө: ${team.primary_color}`
                            : "Өнгө сонгогдоогүй"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {leagues.find((l) => l.id === team.league_id)?.name ??
                        "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(team)}
                          aria-label={`${team.name} засах`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              window.confirm(`"${team.name}" багийг устгах уу?`)
                            ) {
                              deleteMutation.mutate(team.id);
                            }
                          }}
                          aria-label={`${team.name} устгах`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
