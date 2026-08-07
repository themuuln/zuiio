"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ClipboardCheck, Timer, Trophy, Users } from "lucide-react";
import { AdminTableSkeleton } from "@/components/admin/admin-skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { gamesApi, leaguesApi, teamsApi } from "./_lib/api";

export default function AdminDashboardPage() {
  const { data: games, isPending: isGamesPending } = useQuery({
    queryKey: ["admin-dashboard-games"],
    queryFn: () => gamesApi.list(),
  });

  const { data: leagues, isPending: isLeaguesPending } = useQuery({
    queryKey: ["admin-dashboard-leagues"],
    queryFn: () => leaguesApi.list(),
  });

  const { data: teams, isPending: isTeamsPending } = useQuery({
    queryKey: ["admin-dashboard-teams"],
    queryFn: () => teamsApi.list(),
  });

  const finalGames =
    games?.filter((g) => g.status === "final_pending_review") ?? [];
  const scheduledCount =
    games?.filter((g) => g.status === "scheduled").length ?? 0;
  const liveCount =
    games?.filter((g) => g.status === "live_provisional").length ?? 0;
  const pendingReviewCount = finalGames.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Хянах цэс</h1>
        {scheduledCount > 0 && (
          <Badge variant="secondary">{scheduledCount} товлосон тоглолт</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт лиг</CardTitle>
            <Trophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLeaguesPending ? "..." : (leagues?.length ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт баг</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isTeamsPending ? "..." : (teams?.length ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Тоглолт явагдаж буй
            </CardTitle>
            <Timer className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isGamesPending ? "..." : liveCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Хянах шаардлагатай
            </CardTitle>
            <ClipboardCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isGamesPending ? "..." : pendingReviewCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Баталгаажуулах тоглолтууд</CardTitle>
        </CardHeader>
        <CardContent>
          {isGamesPending ? (
            <AdminTableSkeleton rows={4} />
          ) : finalGames.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon" />
              <EmptyHeader>
                <EmptyTitle>Баталгаажуулах тоглолт алга</EmptyTitle>
                <EmptyDescription>
                  Бүх тоглолт баталгаажсан байна.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тоглолт</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Төлөв</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalGames.map((game) => {
                  const home = game.home_team_season?.teams?.short_code ?? "—";
                  const away = game.away_team_season?.teams?.short_code ?? "—";

                  return (
                    <TableRow key={game.id}>
                      <TableCell>
                        <a
                          href={`/admin/games/${game.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {home} vs {away}
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {game.scheduled_at
                          ? format(
                              new Date(game.scheduled_at),
                              "yyyy-MM-dd HH:mm",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{game.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
