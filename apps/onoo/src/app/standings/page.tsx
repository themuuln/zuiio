import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getStandings } from "../lib/data";

export const metadata: Metadata = {
  title: "Шалгуур — Оноо",
  description: "Сагсан бөмбөгийн лигийн шалгуур, багуудын жагсаалт.",
};

export default async function StandingsPage() {
  const standings = await getStandings();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Шалгуур</h1>
        <p className="text-muted-foreground">Багуудын жагсаалт</p>
      </header>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium" scope="col">#</th>
                <th className="px-4 py-3 font-medium" scope="col">Баг</th>
                <th className="px-4 py-3 font-medium text-center" scope="col">
                  Ялагдал
                </th>
                <th className="px-4 py-3 font-medium text-center" scope="col">
                  Оноотой
                </th>
                <th className="px-4 py-3 font-medium text-center" scope="col">
                  Хувь
                </th>
                <th className="px-4 py-3 font-medium text-center" scope="col">
                  Зөрүү
                </th>
                <th className="px-4 py-3 font-medium text-right" scope="col">
                  Оноо (О)
                </th>
                <th className="px-4 py-3 font-medium text-right" scope="col">
                  Оноо (Х)
                </th>
                <th className="px-4 py-3 font-medium text-center" scope="col">
                  Тэмцээний амжилт
                </th>
                <th className="px-4 py-3 font-medium text-center" scope="col">
                  Сүүлийн 10
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr
                  key={row.team_season_id}
                  className="border-b last:border-0 transition-colors hover:bg-accent/30"
                >
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/teams/${row.team_slug}`}
                      className="inline-flex items-center gap-2 hover:underline"
                    >
                      <span
                        className="inline-block size-3 rounded-full border"
                        style={{
                          backgroundColor:
                            row.team_color ?? "oklch(0.5 0 0)",
                        }}
                        aria-hidden="true"
                      />
                      {row.team_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums font-semibold">
                    {row.wins}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {row.losses}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {row.win_pct.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                    {row.gb ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.points_for ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.points_against ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span
                      className={
                        row.streak?.startsWith("W")
                          ? "text-green-600 font-medium"
                          : row.streak?.startsWith("L")
                            ? "text-red-500 font-medium"
                            : ""
                      }
                    >
                      {row.streak ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                    {row.last10 ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
