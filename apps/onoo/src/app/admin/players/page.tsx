"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type PlayerRow, playersApi } from "@/app/admin/_lib/api";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

const positionLabels: Record<string, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C: "Center",
};

const playerSchema = z.object({
  canonical_name: z.string().min(1, "Нэр заавал байх ёстой"),
  name_latin: z.string().optional(),
  position: z.string().optional(),
  nationality: z.string().optional(),
  visibility: z.enum(["public", "hidden"]),
  consent_recorded_at: z.string().optional(),
  consent_note: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

export default function PlayersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: players = [], isPending: playersPending } = useQuery({
    queryKey: ["admin", "players", debouncedSearch],
    queryFn: () => playersApi.list(debouncedSearch || undefined),
  });

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      canonical_name: "",
      name_latin: "",
      position: "",
      nationality: "MN",
      visibility: "public",
      consent_recorded_at: "",
      consent_note: "",
    },
  });

  const watchedName = form.watch("canonical_name");

  const duplicatePlayer =
    watchedName && watchedName.length >= 2
      ? players.find(
          (p) =>
            p.id !== editingPlayer?.id &&
            p.canonical_name.toLowerCase().includes(watchedName.toLowerCase()),
        )
      : null;

  const createMutation = useMutation({
    mutationFn: (data: PlayerFormValues) =>
      playersApi.create({
        canonical_name: data.canonical_name,
        name_latin: data.name_latin || undefined,
        position: data.position || undefined,
        nationality: data.nationality || undefined,
        visibility: data.visibility,
        consent_recorded_at: data.consent_recorded_at || undefined,
        consent_note: data.consent_note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "players"] });
      toast.success("Тоглогч амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: PlayerFormValues & { id: string }) =>
      playersApi.update(id, {
        canonical_name: data.canonical_name,
        name_latin: data.name_latin || undefined,
        position: data.position || undefined,
        nationality: data.nationality || undefined,
        visibility: data.visibility,
        consent_recorded_at: data.consent_recorded_at || undefined,
        consent_note: data.consent_note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "players"] });
      toast.success("Тоглогч амжилттай шинэчлэгдлээ");
      setDialogOpen(false);
      setEditingPlayer(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => playersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "players"] });
      toast.success("Тоглогч устгагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleEdit(player: PlayerRow) {
    setEditingPlayer(player);
    form.reset({
      canonical_name: player.canonical_name,
      name_latin: player.name_latin ?? "",
      position: player.position ?? "",
      nationality: player.nationality ?? "MN",
      visibility: player.visibility ?? "public",
      consent_recorded_at: player.consent_recorded_at
        ? player.consent_recorded_at.slice(0, 10)
        : "",
      consent_note: player.consent_note ?? "",
    });
    setDialogOpen(true);
  }

  function handleSubmit(values: PlayerFormValues) {
    if (editingPlayer) {
      updateMutation.mutate({ ...values, id: editingPlayer.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingPlayer(null);
      form.reset();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-2xl font-bold">Тоглогчид</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Тоглогч хайх..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[250px] pl-9"
                aria-label="Тоглогч хайх"
              />
            </div>

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
                    {editingPlayer ? "Тоглогч засах" : "Шинэ тоглогч нэмэх"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="canonical_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Нэр</FormLabel>
                          <FormControl>
                            <Input placeholder="Тоглогчийн нэр" {...field} />
                          </FormControl>
                          {duplicatePlayer && (
                            <div
                              className="flex items-center gap-2 text-sm text-yellow-600"
                              role="alert"
                            >
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>
                                Адилхан нэртэй тоглогч байна:{" "}
                                {duplicatePlayer.canonical_name}
                              </span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name_latin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Латин нэр</FormLabel>
                          <FormControl>
                            <Input placeholder="Жнь: John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Байрлал</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Байрлал сонгох" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {POSITIONS.map((pos) => (
                                <SelectItem key={pos} value={pos}>
                                  {pos} — {positionLabels[pos]}
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
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Улс</FormLabel>
                          <FormControl>
                            <Input placeholder="Жнь: MN" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Separator />
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Харагдалц</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">Нийтэд</SelectItem>
                              <SelectItem value="hidden">Нууц</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="consent_recorded_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Зөвшөөрлийн огноо</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="consent_note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Зөвшөөрлийн тэмдэглэл</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Зөвшөөрлийн дэлгэрэнгүй..."
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
          {playersPending ? (
            <div className="py-8 text-center text-muted-foreground">
              Ачаалж байна...
            </div>
          ) : players.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Тоглогч олдсонгүй
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Зураг</TableHead>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Харагдалц</TableHead>
                  <TableHead>Латин нэр</TableHead>
                  <TableHead>Байрлал</TableHead>
                  <TableHead>Улс</TableHead>
                  <TableHead className="w-[100px]">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <PhotoUploader
                        entityId={player.id}
                        entityType="player"
                        currentUrl={player.photo_url}
                        onUploaded={() =>
                          queryClient.invalidateQueries({
                            queryKey: ["admin", "players"],
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {player.canonical_name}
                    </TableCell>
                    <TableCell>
                      {player.visibility === "hidden" ? (
                        <Badge
                          variant="outline"
                          className="border-muted-foreground/40 text-muted-foreground"
                        >
                          Нууц
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Нийтэд</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {player.name_latin ?? "—"}
                    </TableCell>
                    <TableCell>
                      {player.position ? (
                        <Badge variant="secondary">{player.position}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{player.nationality}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(player)}
                          aria-label={`${player.canonical_name} засах`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              window.confirm(
                                `"${player.canonical_name}" тоглогчийг устгах уу?`,
                              )
                            ) {
                              deleteMutation.mutate(player.id);
                            }
                          }}
                          aria-label={`${player.canonical_name} устгах`}
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
