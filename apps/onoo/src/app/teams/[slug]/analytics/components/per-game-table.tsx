import Link from "next/link";
import type { TeamAdvancedStatsPerGame } from "@/app/lib/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PerGameTableProps {
  games: TeamAdvancedStatsPerGame[];
  className?: string;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("mn-MN", {
    month: "numeric",
    day: "numeric",
  });
}

export function PerGameTable({ games, className }: PerGameTableProps) {
  if (games.length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Тоглолтын дэлгэрэнгүй</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Тоглолтын өгөгдөл байхгүй байна.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Тоглолтын дэлгэрэнгүй</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Өдөр</TableHead>
                <TableHead>Өрсөлдөгч</TableHead>
                <TableHead>Үр дүн</TableHead>
                <TableHead>Оноо</TableHead>
                <TableHead className="text-right">ORtg</TableHead>
                <TableHead className="text-right">DRtg</TableHead>
                <TableHead className="text-right">NetRtg</TableHead>
                <TableHead className="text-right">Pace</TableHead>
                <TableHead className="text-right">PIE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.game_id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(game.scheduled_at)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/teams/${game.opponent_slug}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {game.home_away === "home" ? "vs " : "@ "}
                      {game.opponent_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={game.result === "W" ? "default" : "secondary"}
                      className={cn(
                        "font-mono text-xs",
                        game.result === "W" &&
                          "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
                      )}
                    >
                      {game.result === "W" ? "ЯЛАЛТ" : "ЯЛАГДАЛ"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    <span className="font-semibold">{game.team_score}</span>
                    <span className="text-muted-foreground">–</span>
                    <span>{game.opp_score}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {game.ortg.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {game.drtg.toFixed(1)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono text-sm tabular-nums",
                      game.net_rtg > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {game.net_rtg > 0 ? "+" : ""}
                    {game.net_rtg.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {game.pace.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {game.pie.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
