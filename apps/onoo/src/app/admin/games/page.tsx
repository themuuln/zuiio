"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  gamesApi,
  competitionsApi,
  venuesApi,
  teamSeasonsApi,
  type GameRow,
} from "@/app/admin/_lib/api";

const gameSchema = z
  .object({
    competition_id: z.string().min(1),
    home_team_season_id: z.string().min(1),
    away_team_season_id: z.string().min(1),
    venue_id: z.string().optional(),
    scheduled_at: z.string().min(1),
  })
  .refine((d) => d.home_team_season_id !== d.away_team_season_id, {
    message: "Эхлэх ба зочин баг адилхан байж болохгүй",
    path: ["away_team_season_id"],
  });

type GameFormValues = z.infer<typeof gameSchema>;

function statusBadgeVariant(status: string) {
  switch (status) {
    case "scheduled":
      return "secondary";
    case "live":
      return "destructive";
    case "final":
      return "outline";
    case "verified":
      return "default";
    case "official":
      return "default";
    case "cancelled":
      return "secondary";
    default:
      return "secondary";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "Товлосон";
    case "live":
      return "Дүрэлзүүлсэн";
    case "final":
      return "Дууссан";
    case "verified":
      return "Баталгаажуулсан";
    case "official":
      return "Албан ёс";
    case "cancelled":
      return "Цуцалсан";
    default:
      return status;
  }
}

export default function AdminGamesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("");

  const { data: games = [], isPending: gamesPending } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: () => gamesApi.list(),
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["admin", "competitions"],
    queryFn: () => competitionsApi.list(),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["admin", "venues"],
    queryFn: () => venuesApi.list(),
  });

  const { data: teamSeasons = [] } = useQuery({
    queryKey: ["admin", "team-seasons", selectedCompetitionId],
    queryFn: () => teamSeasonsApi.list(selectedCompetitionId),
    enabled: !!selectedCompetitionId,
  });

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      competition_id: "",
      home_team_season_id: "",
      away_team_season_id: "",
      venue_id: "",
      scheduled_at: "",
    },
  });

  async function onSubmit(values: GameFormValues) {
    try {
      await gamesApi.create({
        ...values,
        venue_id: values.venue_id || undefined,
      });
      toast.success("Тоглолт амжилттай үүсгэлээ");
      queryClient.invalidateQueries({ queryKey: ["admin", "games"] });
      setCreateOpen(false);
      form.reset();
      setSelectedCompetitionId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }

  function getTeamName(
    game: GameRow,
    side: "home" | "away"
  ): string {
    const ts = side === "home" ? game.home_team_season : game.away_team_season;
    return ts?.teams?.name ?? "Тодорхойгүй";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Тоглолтууд</h1>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) {
              form.reset();
              setSelectedCompetitionId("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Шинэ тоглолт
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ тоглолт үүсгэх</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="competition_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Уралдаан</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          setSelectedCompetitionId(val);
                          form.setValue("home_team_season_id", "");
                          form.setValue("away_team_season_id", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Уралдаан сонгох" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {competitions.map((comp) => (
                            <SelectItem key={comp.id} value={comp.id}>
                              {comp.name}
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
                  name="home_team_season_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Эхлэх баг</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedCompetitionId}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Эхлэх баг сонгох" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamSeasons.map((ts) => (
                            <SelectItem key={ts.id} value={ts.id}>
                              {ts.teams?.name ?? ts.id}
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
                  name="away_team_season_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Зочин баг</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedCompetitionId}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Зочин баг сонгох" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamSeasons.map((ts) => (
                            <SelectItem key={ts.id} value={ts.id}>
                              {ts.teams?.name ?? ts.id}
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
                  name="venue_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Талбай (заавал биш)</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(val) => field.onChange(val || "")}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Талбай сонгох" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {venues.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name}
                              {v.city ? ` (${v.city})` : ""}
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
                  name="scheduled_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Товлосон огноо</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  Үүсгэх
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Тоглолтууд</CardTitle>
        </CardHeader>
        <CardContent>
          {gamesPending ? (
            <p className="text-muted-foreground">Ачаалж байна...</p>
          ) : games.length === 0 ? (
            <p className="text-muted-foreground">Тоглолт олдсонгүй</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Эсрэг багууд</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead>Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      {getTeamName(game, "home")} vs{" "}
                      {getTeamName(game, "away")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(game.scheduled_at), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusBadgeVariant(game.status) as "default" | "secondary" | "destructive" | "outline"}
                        className={
                          game.status === "official"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : undefined
                        }
                      >
                        {statusLabel(game.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`/admin/games/${game.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Дэлгэрэнгүй
                      </a>
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
