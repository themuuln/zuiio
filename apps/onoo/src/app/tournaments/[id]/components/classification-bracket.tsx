import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { ClassificationRound } from "../../../lib/shared";

export function ClassificationBracket({
  rounds,
}: {
  rounds: ClassificationRound[];
}) {
  if (!rounds || rounds.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Классификацийн шат</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rounds.map((round) => (
            <div key={round.round}>
              <h4 className="text-sm text-muted-foreground mb-2">
                {round.round}
              </h4>
              <div className="space-y-2">
                {round.games.map((g) => (
                  <div
                    key={`${g.home_team_name}-${g.away_team_name}`}
                    className="flex items-center justify-between text-sm p-2 rounded border"
                  >
                    <span>{g.home_team_name}</span>
                    <span className="font-mono font-bold mx-3">
                      {g.home_score ?? "?"} – {g.away_score ?? "?"}
                    </span>
                    <span>{g.away_team_name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
