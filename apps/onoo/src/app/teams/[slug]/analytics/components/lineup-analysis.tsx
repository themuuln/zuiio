import { getLineupsByTeam } from "@/app/lib/data";
import type { LineupStats } from "@/app/lib/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LineupAnalysisProps {
  teamSeasonId: string;
}
export async function LineupAnalysis({ teamSeasonId }: LineupAnalysisProps) {
  const lineups = await getLineupsByTeam(teamSeasonId);

  if (lineups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Бүрэлдэхүүний шинжилгээ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Хангалттай орлуулалтын өгөгдөл байхгүй байна.
            <br />
            Тэмдэглэгч орлуулалтын event-үүдийг бүртгэсний дараа энд харагдана.
          </p>
        </CardContent>
      </Card>
    );
  }
  const sorted = [...lineups].sort((a, b) => b.net_rating - a.net_rating);
  const top5 = sorted.slice(0, 5);
  const bottom5 =
    sorted.length >= 5 ? sorted.slice(-5).reverse() : sorted.slice().reverse();

  const renderTable = (items: LineupStats[], label: string) => (
    <Card key={label}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тоглогчид</TableHead>
              <TableHead className="text-center">ТТ</TableHead>
              <TableHead className="text-center">Мин</TableHead>
              <TableHead className="text-center">NETRTG</TableHead>
              <TableHead className="text-center">+/-</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((l) => (
              <TableRow key={l.player_ids.join("-")}>
                <TableCell className="text-xs max-w-[200px] truncate">
                  {l.player_names.join(", ")}
                </TableCell>
                <TableCell className="text-center">{l.games_count}</TableCell>
                <TableCell className="text-center">{l.minutes_total}</TableCell>
                <TableCell
                  className={`text-center font-bold ${l.net_rating > 0 ? "text-green-600" : l.net_rating < 0 ? "text-red-600" : ""}`}
                >
                  {l.net_rating > 0 ? "+" : ""}
                  {l.net_rating.toFixed(1)}
                </TableCell>
                <TableCell
                  className={`text-center ${l.plus_minus > 0 ? "text-green-600" : l.plus_minus < 0 ? "text-red-600" : ""}`}
                >
                  {l.plus_minus > 0 ? "+" : ""}
                  {l.plus_minus}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderTable(top5, "Шилдэг 5 бүрэлдэхүүн")}
      {renderTable(bottom5, "Сул 5 бүрэлдэхүүн")}
    </div>
  );
}
