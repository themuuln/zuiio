"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { gamesApi } from "./_lib/api";

export default function AdminDashboardPage() {
  const { data: games, isPending } = useQuery({
    queryKey: ["admin-dashboard-games"],
    queryFn: () => gamesApi.list(),
  });

  const finalGames =
    games?.filter((g) => g.status === "final_pending_review") ?? [];
  const scheduledCount =
    games?.filter((g) => g.status === "scheduled").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Хянах цэс</h1>
        {scheduledCount > 0 && (
          <Badge variant="secondary">{scheduledCount} товлосон тоглолт</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Баталгаажуулах тоглолтууд</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
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
