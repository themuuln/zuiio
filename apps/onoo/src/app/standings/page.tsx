import { BarChart3, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PublicEmptyState } from "../components/public-empty-state";
import { getStandings, type StandingRow } from "../lib/data";

export const metadata: Metadata = {
  title: "Шалгуур — Оноо",
  description: "Лигийн байрлал, багуудын форм, цуврал болон онооны зөрүү.",
};

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(1)}%`;
}

function getPointDifference(row: StandingRow): number {
  return (row.points_for ?? 0) - (row.points_against ?? 0);
}

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  const { competition } = await searchParams;
  const allStandings = await getStandings();
  const competitions = Array.from(
    new Map(
      allStandings.map((row) => [
        row.competition_id,
        { name: row.competition_name, season: row.season_name },
      ]),
    ),
  );
  const activeCompetitionId = competition ?? competitions[0]?.[0];
  const standings = activeCompetitionId
    ? allStandings.filter((row) => row.competition_id === activeCompetitionId)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="grid gap-5 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Лигийн өрсөлдөөн
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Шалгуур
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Байрлал, ялалт-хожигдол, сүүлийн форм болон онооны зөрүүг нэг дор
            харьцуулна.
          </p>
        </div>
        {competitions.length > 1 ? (
          <nav
            aria-label="Тэмцээн сонгох"
            className="flex flex-wrap gap-2 lg:col-span-5 lg:justify-end"
          >
            {competitions.map(([id, item]) => (
              <Button
                key={id}
                asChild
                variant={id === activeCompetitionId ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/standings?competition=${id}`}>
                  {item.name} · {item.season}
                </Link>
              </Button>
            ))}
          </nav>
        ) : null}
      </header>

      {standings.length === 0 ? (
        <PublicEmptyState
          icon={Trophy}
          title="Шалгуур хараахан үүсээгүй"
          description="Баталгаажсан эхний тоглолтын дараа багуудын байрлал энд автоматаар гарна."
          actionHref="/games"
          actionLabel="Тоглолтууд харах"
        />
      ) : (
        <>
          <section
            aria-labelledby="standings-race-heading"
            className="flex flex-col gap-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Тэргүүн хэсэг
              </p>
              <h2
                id="standings-race-heading"
                className="mt-1 text-2xl font-bold tracking-tight"
              >
                Лигийн уралдаан
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {standings.slice(0, 3).map((row, index) => (
                <Link
                  key={row.team_season_id}
                  href={`/teams/${row.team_slug}`}
                  className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="h-full shadow-none transition-[background-color,transform] group-hover:bg-accent/40 group-active:scale-95 motion-reduce:transition-none">
                    <CardHeader>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <div className="mt-3 flex items-center gap-3">
                        <TeamLogo
                          logoUrl={row.team_logo_url}
                          shortCode={row.team_short_code}
                          primaryColor={row.team_primary_color}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <CardTitle className="truncate text-xl">
                            {row.team_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {row.w} ялалт · {row.l} хожигдол
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                      <RaceStat
                        label="ХУВЬ"
                        value={formatPercent(row.win_pct)}
                      />
                      <RaceStat label="ЦУВРАЛ" value={row.streak ?? "—"} />
                      <RaceStat label="СҮҮЛИЙН 10" value={row.last10 ?? "—"} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="full-standings-heading"
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Бүрэн бүртгэл
                </p>
                <h2
                  id="full-standings-heading"
                  className="mt-1 text-2xl font-bold tracking-tight"
                >
                  Бүх баг
                </h2>
              </div>
              <Badge variant="outline">
                <BarChart3 data-icon="inline-start" aria-hidden="true" />
                {standings.length} баг
              </Badge>
            </div>
            <Card className="shadow-none">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Баг</TableHead>
                      <TableHead className="text-center">Я</TableHead>
                      <TableHead className="text-center">Х</TableHead>
                      <TableHead className="text-center">Хувь</TableHead>
                      <TableHead className="text-center">GB</TableHead>
                      <TableHead className="text-center">Цуврал</TableHead>
                      <TableHead className="text-center">Сүүлийн 10</TableHead>
                      <TableHead className="text-right">Зөрүү</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((row, index) => {
                      const pointDifference = getPointDifference(row);
                      return (
                        <TableRow key={row.team_season_id}>
                          <TableCell className="font-semibold tabular-nums text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/teams/${row.team_slug}`}
                              className="inline-flex items-center gap-3 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <TeamLogo
                                logoUrl={row.team_logo_url}
                                shortCode={row.team_short_code}
                                primaryColor={row.team_primary_color}
                              />
                              {row.team_name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center font-semibold tabular-nums">
                            {row.w}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {row.l}
                          </TableCell>
                          <TableCell className="text-center font-semibold tabular-nums">
                            {formatPercent(row.win_pct)}
                          </TableCell>
                          <TableCell className="text-center tabular-nums text-muted-foreground">
                            {row.gb ?? "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{row.streak ?? "—"}</Badge>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {row.last10 ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {pointDifference > 0 ? "+" : ""}
                            {pointDifference}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Я — ялалт, Х — хожигдол, GB — тэргүүлэгчээс хоцорч буй тоглолт.
              Тэнцсэн үед лигийн баталсан тай-брейк дүрэм үйлчилнэ.
            </p>
          </section>
        </>
      )}
    </main>
  );
}

interface RaceStatProps {
  label: string;
  value: string;
}

// Display-only statistic: loading and empty states are handled by the page.
function RaceStat({ label, value }: RaceStatProps) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <p className="font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-semibold tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
