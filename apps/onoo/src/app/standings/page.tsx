import { BarChart3, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { ViewBeacon } from "@/components/view-beacon";
import { PublicEmptyState } from "../components/public-empty-state";
import { getStandings } from "../lib/data";
import { StandingsTable } from "./components/standings-table";

export const metadata: Metadata = {
  title: "Шалгуур — Оноо",
  description: "Лигийн байрлал, багуудын форм, цуврал болон онооны зөрүү.",
};

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(1)}%`;
}

function _getPointDifference(row: {
  points_for: number | null;
  points_against: number | null;
}): number {
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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <ViewBeacon
        entityType="standings"
        entityId="00000000-0000-0000-0000-000000000000"
      />
      <header className="flex flex-col gap-4">
        <div>
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
        {competitions.length > 1 && (
          <nav aria-label="Тэмцээн сонгох" className="flex flex-wrap gap-2">
            {competitions.map(([id, item]) => (
              <Button
                key={id}
                asChild
                variant={id === activeCompetitionId ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/tournaments/${id}`}>
                  {item.name} · {item.season}
                </Link>
              </Button>
            ))}
          </nav>
        )}
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
          {/* Top 3 race cards — hero section */}
          <section
            aria-labelledby="standings-race-heading"
            className="court-divider rounded-xl bg-[var(--surface-1)] p-6 sm:p-8"
          >
            <div className="flex items-end justify-between gap-4 mb-6">
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
              <Badge variant="outline">
                <BarChart3 data-icon="inline-start" aria-hidden="true" />
                {standings.length} баг
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {standings.slice(0, 3).map((row, index) => (
                <Link
                  key={row.team_season_id}
                  href={`/teams/${row.team_slug}`}
                  className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`${row.team_name} — ${index + 1}-р байр, ${row.w} ялалт`}
                >
                  <Card
                    className="h-full shadow-none transition-[box-shadow,transform] group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none"
                    style={
                      index === 0 && row.team_primary_color
                        ? {
                            borderTop: `3px solid ${row.team_primary_color}`,
                          }
                        : undefined
                    }
                  >
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

          {/* Full standings table — interactive with collapsible rows */}
          <section
            aria-labelledby="full-standings-heading"
            className="flex flex-col gap-4"
          >
            <div>
              <h2
                id="full-standings-heading"
                className="text-2xl font-bold tracking-tight"
              >
                Бүх баг
              </h2>
            </div>
            <Card className="shadow-none">
              <CardContent className="p-0">
                <StandingsTable rows={standings} />
              </CardContent>
              <p className="md:hidden text-xs text-muted-foreground text-center mt-2">
                Ширээ бага зэрэг гүйлгэж бүтэн хүснэгтийг үзнэ үү. Мөр дээр дарж
                дэлгэрэнгүй үзнэ.
              </p>
            </Card>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Я — ялалт, Х — хожигдол, GB — тэргүүлэгчээс хоцорч буй тоглолт.
              Мөр дээр дарж дэлгэрэнгүй үзнэ. Тэнцсэн үед лигийн баталсан
              тай-брейк дүрэм үйлчилнэ.
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
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}
