"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  awardsApi,
  type CompetitionRow,
  catalogRefApi,
  type PlayerRow,
} from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const AWARD_TYPES = [
  { value: "player_of_week", label: "Долоо хоногийн тоглогч" },
  { value: "mvp", label: "MVP" },
  { value: "top_scorer", label: "Мэргэн бууч" },
] as const;

function awardTypeBadge(type: string) {
  const config: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
    mvp: { label: "MVP", variant: "default" },
    player_of_week: { label: "7 хоногийн тоглогч", variant: "secondary" },
    top_scorer: { label: "Мэргэн бууч", variant: "outline" },
  };
  const c = config[type] ?? { label: type, variant: "outline" };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(`${d}T12:00:00`).toLocaleDateString("mn-MN");
}

export default function AwardsPage() {
  const queryClient = useQueryClient();
  const [grantOpen, setGrantOpen] = useState(false);

  // Form state
  const [competitionId, setCompetitionId] = useState("");
  const [awardType, setAwardType] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [note, setNote] = useState("");

  // Queries
  const { data: awards, isLoading: awardsLoading } = useQuery({
    queryKey: ["admin", "awards"],
    queryFn: () => awardsApi.list(),
  });

  const { data: ref } = useQuery({
    queryKey: ["admin", "catalog", "reference"],
    queryFn: () => catalogRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const competitions = (ref?.competitions ?? []) as CompetitionRow[];
  const players = (ref?.players ?? []) as PlayerRow[];

  const grantMutation = useMutation({
    mutationFn: (data: {
      competition_id: string;
      award_type: string;
      player_id: string;
      period_start?: string;
      period_end?: string;
      note?: string;
    }) => awardsApi.grant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "awards"] });
      toast.success("Шагнал амжилттай олгогдлоо");
      setGrantOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Шагнал олгоход алдаа гарлаа");
    },
  });

  function resetForm() {
    setCompetitionId("");
    setAwardType("");
    setPlayerId("");
    setPlayerSearch("");
    setPeriodStart("");
    setPeriodEnd("");
    setNote("");
  }

  const filteredPlayers = (players ?? []).filter(
    (p) =>
      !playerSearch ||
      p.canonical_name?.toLowerCase().includes(playerSearch.toLowerCase()),
  );

  return (
    <AdminPageLayout
      title="Шагнал"
      loading={awardsLoading}
      isEmpty={!awardsLoading && (!awards || awards.length === 0)}
      emptyTitle="Шагнал байхгүй байна"
      emptyDescription="Шинэ шагнал олгохын тулд дээрх товчийг дарна уу"
      actions={
        <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="mr-1 size-4" />
              Шагнал олгох
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Шагнал олгох</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Competition */}
              <div className="grid gap-2">
                <Label>Тэмцээн</Label>
                <Select value={competitionId} onValueChange={setCompetitionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Тэмцээн сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {(competitions ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name ?? c.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Award type */}
              <div className="grid gap-2">
                <Label>Шагналын төрөл</Label>
                <Select value={awardType} onValueChange={setAwardType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Төрөл сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {AWARD_TYPES.map((at) => (
                      <SelectItem key={at.value} value={at.value}>
                        {at.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Player */}
              <div className="grid gap-2">
                <Label>Тоглогч</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Тоглогч хайх..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md border">
                  {filteredPlayers.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">
                      Тоглогч олдсонгүй
                    </p>
                  ) : (
                    filteredPlayers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                          playerId === p.id ? "bg-primary/10 font-medium" : ""
                        }`}
                        onClick={() => {
                          setPlayerId(p.id);
                          setPlayerSearch(p.canonical_name ?? "");
                        }}
                      >
                        {p.canonical_name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Period */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Эхлэх огноо</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Дуусах огноо</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Note */}
              <div className="grid gap-2">
                <Label>Тэмдэглэл</Label>
                <Textarea
                  placeholder="Нэмэлт мэдээлэл..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setGrantOpen(false)}>
                Болих
              </Button>
              <Button
                onClick={() =>
                  grantMutation.mutate({
                    competition_id: competitionId,
                    award_type: awardType,
                    player_id: playerId,
                    period_start: periodStart || undefined,
                    period_end: periodEnd || undefined,
                    note: note || undefined,
                  })
                }
                disabled={
                  !competitionId ||
                  !awardType ||
                  !playerId ||
                  grantMutation.isPending
                }
              >
                {grantMutation.isPending ? "Олгож байна..." : "Олгох"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Төрөл</TableHead>
            <TableHead>Тоглогч</TableHead>
            <TableHead>Тэмцээн</TableHead>
            <TableHead>Хугацаа</TableHead>
            <TableHead>Олгогдсон</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(awards ?? []).map((award) => (
            <TableRow key={award.id}>
              <TableCell>{awardTypeBadge(award.award_type)}</TableCell>
              <TableCell className="font-medium">
                {award.players?.canonical_name ?? award.player_id.slice(0, 8)}
              </TableCell>
              <TableCell>{award.competition_id.slice(0, 8)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {award.period_start || award.period_end
                  ? `${formatDate(award.period_start)} – ${formatDate(award.period_end)}`
                  : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(award.granted_at).toLocaleDateString("mn-MN")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminPageLayout>
  );
}
