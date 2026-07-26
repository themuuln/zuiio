import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { TournamentGroup } from "../../../lib/shared";

export function GroupStandings({ groups }: { groups: TournamentGroup[] }) {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="font-semibold mb-2">Хэсэг {group.name}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Баг</TableHead>
                <TableHead className="text-center w-12">Я</TableHead>
                <TableHead className="text-center w-12">Х</TableHead>
                <TableHead className="text-center w-12">О</TableHead>
                <TableHead className="text-center w-12">А</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.teams.map((team) => (
                <TableRow key={team.team_id}>
                  <TableCell className="font-medium">
                    {team.team_name}
                  </TableCell>
                  <TableCell className="text-center">{team.wins}</TableCell>
                  <TableCell className="text-center">{team.losses}</TableCell>
                  <TableCell className="text-center">
                    {team.points_for}
                  </TableCell>
                  <TableCell className="text-center">
                    {team.points_against}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
