"use client";

import { format } from "date-fns";
import type { HeadToHeadGame, HeadToHeadResult } from "@/app/lib/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MatchupClientProps {
  teamA: { name: string; id: string; slug: string };
  teamB: { name: string; id: string; slug: string };
  headToHead: HeadToHeadResult;
}

export function MatchupClient({
  teamA,
  teamB,
  headToHead,
}: MatchupClientProps) {
  const { games, teamAWins, teamBWins, meetings } = headToHead;

  return (
    <div className="container py-8">
      {/* Series Record */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {teamA.name} vs {teamB.name}
        </h1>
        <div className="text-xl">
          <span className="font-bold">{teamAWins}</span>
          <span className="mx-2">&ndash;</span>
          <span className="font-bold">{teamBWins}</span>
          <span className="text-muted-foreground ml-2">
            ({meetings} тоглолт)
          </span>
        </div>
      </div>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Тоглолтууд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {games.map((g: HeadToHeadGame) => {
              const isAWin =
                g.home_team_id === teamA.id
                  ? (g.home_score ?? 0) > (g.away_score ?? 0)
                  : (g.away_score ?? 0) > (g.home_score ?? 0);
              return (
                <div
                  key={g.game_id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="text-sm text-muted-foreground">
                    {g.scheduled_at
                      ? format(new Date(g.scheduled_at), "yyyy/MM/dd")
                      : "\u2014"}
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={g.home_team_id === teamA.id ? "font-bold" : ""}
                    >
                      {g.home_team_name}
                    </span>
                    <span className="font-mono font-bold">
                      {g.home_score ?? "?"} &ndash; {g.away_score ?? "?"}
                    </span>
                    <span
                      className={g.away_team_id === teamA.id ? "font-bold" : ""}
                    >
                      {g.away_team_name}
                    </span>
                  </div>
                  <Badge variant={isAWin ? "default" : "secondary"}>
                    {isAWin ? "ЯЛАЛТ" : "ЯЛАГДАЛ"}
                  </Badge>
                </div>
              );
            })}
            {games.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Эдгээр багууд хоорондоо тоглоогүй байна.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
