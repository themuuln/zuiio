"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Calendar, MapPin, Trophy } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { type GameRow, gamesApi } from "@/app/admin/_lib/api";
import { AdminCardSkeleton } from "@/components/admin/admin-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewTab } from "./components/review-tab";

function statusBadgeVariant(status: string) {
  switch (status) {
    case "scheduled":
      return "secondary";
    case "live_provisional":
      return "destructive";
    case "final_pending_review":
      return "outline";
    case "league_verified":
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
    case "live_provisional":
      return "Дүрэлзүүлсэн";
    case "final_pending_review":
      return "Дууссан";
    case "league_verified":
      return "Баталгаажуулсан";
    case "official":
      return "Албан ёс";
    case "cancelled":
      return "Цуцалсан";
    default:
      return status;
  }
}

function getTeamName(game: GameRow, side: "home" | "away"): string {
  const ts = side === "home" ? game.home_team_season : game.away_team_season;
  return ts?.teams?.name ?? "Тодорхойгүй";
}

export default function GameDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: game,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["admin", "game", params.id],
    queryFn: () => gamesApi.get(params.id),
  });

  async function updateStatus(newStatus: string) {
    if (!game) return;
    const confirmed = window.confirm(
      `"${homeName}" vs "${awayName}" тоглолтын төлөв "${statusLabel(newStatus)}" болгох уу?`,
    );
    if (!confirmed) return;
    try {
      await gamesApi.updateStatus(game.id, newStatus);
      toast.success("Төлөв шинэчлэгдлээ");
      queryClient.invalidateQueries({ queryKey: ["admin", "game", game.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "games"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <a
          href="/admin/games"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Буцах
        </a>
        <AdminCardSkeleton />
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="space-y-6">
        <a
          href="/admin/games"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Буцах
        </a>
        <Empty>
          <EmptyMedia variant="icon" />
          <EmptyHeader>
            <EmptyTitle>Тоглолт олдсонгүй</EmptyTitle>
            <EmptyDescription>
              Энэ тоглолтын мэдээлэл олдсонгүй.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const homeName = getTeamName(game, "home");
  const awayName = getTeamName(game, "away");
  const hasScore = game.home_score !== null && game.away_score !== null;

  return (
    <div className="space-y-6">
      <a
        href="/admin/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Буцах
      </a>

      <h1 className="text-2xl font-bold">
        {homeName} vs {awayName}
      </h1>

      <Tabs defaultValue="game">
        <TabsList>
          <TabsTrigger value="game">Тоглолт</TabsTrigger>
          <TabsTrigger value="review">Шалгах</TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Уралдаан:</span>
                  <span>{game.competitions?.name ?? "Тодорхойгүй"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Талбай:</span>
                  <span>
                    {game.venues
                      ? `${game.venues.name}${game.venues.city ? `, ${game.venues.city}` : ""}`
                      : "Тодорхойгүй"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Огноо:</span>
                  <span>
                    {format(new Date(game.scheduled_at), "yyyy-MM-dd HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Төлөв:</span>
                  <Badge
                    variant={
                      statusBadgeVariant(game.status) as
                        | "default"
                        | "secondary"
                        | "destructive"
                        | "outline"
                    }
                    className={
                      game.status === "official"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : undefined
                    }
                  >
                    {statusLabel(game.status)}
                  </Badge>
                </div>
              </div>

              {hasScore && (
                <div className="flex items-center justify-center gap-4 rounded-lg bg-muted py-6">
                  <span className="text-3xl font-bold">{game.home_score}</span>
                  <span className="text-xl text-muted-foreground">-</span>
                  <span className="text-3xl font-bold">{game.away_score}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {game.status === "scheduled" && (
                  <Button onClick={() => updateStatus("live_provisional")}>
                    Тоглолт эхлүүлэх
                  </Button>
                )}
                {game.status === "final_pending_review" && (
                  <Button onClick={() => updateStatus("league_verified")}>
                    Баталгаажуулах
                  </Button>
                )}
                {game.status === "league_verified" && (
                  <Button onClick={() => updateStatus("official")}>
                    Албан ёс болгох
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Тоглогчдын жагсаалт</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Тоглогчдын жагсаалт удахгүй нэмэгдэнэ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Хариуцагчид</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Хариуцагчид удахгүй нэмэгдэнэ
              </p>
              <Button
                onClick={() =>
                  window.open(`/admin/games/${game.id}/box-entry`, "_blank")
                }
                variant="outline"
              >
                Албан ёсны PDF импортлох
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <ReviewTab gameId={game.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
