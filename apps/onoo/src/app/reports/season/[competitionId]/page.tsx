import { FileDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { Button } from "@/components/ui";
import { PublicEmptyState } from "../../../components/public-empty-state";
import { getCompetition, getLeaders, getStandings } from "../../../lib/data";
import { PrintButton } from "./print-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}): Promise<Metadata> {
  const { competitionId } = await params;
  const competition = await getCompetition(competitionId);
  return {
    title: competition
      ? `${competition.name} — Улирлын тайлан — Оноо`
      : "Тайлан — Оноо",
    description: competition
      ? `${competition.name} (${competition.season}) улирлын бүрэн тайлан.`
      : "Улирлын тайлан.",
  };
}

export default async function SeasonReportPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const [competition, allStandings, allLeaders] = await Promise.all([
    getCompetition(competitionId),
    getStandings(),
    getLeaders(true),
  ]);

  if (!competition) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PublicEmptyState
          icon={FileDown}
          title="Тэмцээн олдсонгүй"
          description="Энэ тэмцээний тайлан байхгүй байна."
          actionHref="/standings"
          actionLabel="Шалгуур харах"
        />
      </main>
    );
  }

  const standings = allStandings.filter(
    (row) => row.competition_id === competitionId,
  );
  const leaders = allLeaders
    .filter((row) => row.competition_id === competitionId)
    .sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0))
    .slice(0, 10);

  const champion = standings[0] ?? null;
  const teamsCount = standings.length;
  const totalGames = standings.reduce(
    (sum, row) => sum + (row.w ?? 0) + (row.l ?? 0),
    0,
  );

  // Average PPG across all teams
  const avgPtsFor =
    teamsCount > 0
      ? standings.reduce((sum, row) => sum + (row.points_for ?? 0), 0) /
        teamsCount
      : 0;
  const avgPtsAgainst =
    teamsCount > 0
      ? standings.reduce((sum, row) => sum + (row.points_against ?? 0), 0) /
        teamsCount
      : 0;

  return (
    <main className="report-page mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Print controls — hidden in print */}
      <header className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {competition.league}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {competition.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            {competition.season} улирлын тайлан
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/standings?competition=${competitionId}`}>
              Шалгуур руу буцах
            </Link>
          </Button>
        </div>
      </header>

      {/* Champion Callout */}
      {champion && (
        <section
          aria-labelledby="champion-heading"
          className="court-divider rounded-xl bg-[var(--surface-1)] p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Улирлын аварга
              </p>
              <h2
                id="champion-heading"
                className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl"
              >
                {champion.team_name}
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                {champion.w} ялалт — {champion.l} хожигдол (
                {(champion.win_pct * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <TeamLogo
                logoUrl={champion.team_logo_url}
                shortCode={champion.team_short_code}
                primaryColor={champion.team_primary_color}
                size="xl"
              />
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Онооны зөрүү</p>
                <p className="text-2xl font-bold">
                  {(champion.points_for ?? 0) - (champion.points_against ?? 0) >
                  0
                    ? "+"
                    : ""}
                  {(champion.points_for ?? 0) - (champion.points_against ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Season Summary Stats */}
      <section
        aria-labelledby="summary-heading"
        className="grid gap-4 sm:grid-cols-3"
      >
        <div className="rounded-xl border bg-card p-4 text-card-foreground">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Багууд
          </p>
          <p className="mt-1 text-3xl font-bold">{teamsCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-card-foreground">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Тоглолт
          </p>
          <p className="mt-1 text-3xl font-bold">{totalGames}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-card-foreground">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Дундаж оноо (авсан/өгсөн)
          </p>
          <p className="mt-1 text-3xl font-bold">
            {avgPtsFor.toFixed(0)} / {avgPtsAgainst.toFixed(0)}
          </p>
        </div>
      </section>

      {/* Full Standings Table */}
      {standings.length > 0 && (
        <section aria-labelledby="standings-heading">
          <h2
            id="standings-heading"
            className="mb-4 font-display text-2xl font-semibold"
          >
            Байрлал
          </h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="report-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">№</th>
                  <th className="p-3">Баг</th>
                  <th className="p-3 text-center">Т</th>
                  <th className="p-3 text-center">Я</th>
                  <th className="p-3 text-center">Х</th>
                  <th className="p-3 text-center">%</th>
                  <th className="p-3 text-center">GB</th>
                  <th className="p-3 text-center">А.О</th>
                  <th className="p-3 text-center">Ө.О</th>
                  <th className="p-3 text-center">±</th>
                  <th className="p-3 text-center">Цуврал</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, index) => {
                  const diff =
                    (row.points_for ?? 0) - (row.points_against ?? 0);
                  return (
                    <tr
                      key={row.team_season_id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-3 font-medium">{index + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <TeamLogo
                            logoUrl={row.team_logo_url}
                            shortCode={row.team_short_code}
                            primaryColor={row.team_primary_color}
                            size="sm"
                          />
                          <span className="font-medium">{row.team_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {(row.w ?? 0) + (row.l ?? 0)}
                      </td>
                      <td className="p-3 text-center">{row.w}</td>
                      <td className="p-3 text-center">{row.l}</td>
                      <td className="p-3 text-center font-medium">
                        {(row.win_pct * 100).toFixed(1)}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {row.gb != null ? row.gb.toFixed(1) : "—"}
                      </td>
                      <td className="p-3 text-center">
                        {row.points_for ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        {row.points_against ?? "—"}
                      </td>
                      <td
                        className={`p-3 text-center font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}
                      >
                        {diff > 0 ? "+" : ""}
                        {diff}
                      </td>
                      <td className="p-3 text-center">{row.streak ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top-10 Leaders */}
      {leaders.length > 0 && (
        <section aria-labelledby="leaders-heading">
          <h2
            id="leaders-heading"
            className="mb-4 font-display text-2xl font-semibold"
          >
            Шилдэг 10 тоглогч (Оноо)
          </h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="report-table w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">№</th>
                  <th className="p-3">Тоглогч</th>
                  <th className="p-3">Баг</th>
                  <th className="p-3 text-center">Т</th>
                  <th className="p-3 text-center">Оноо</th>
                  <th className="p-3 text-center">Дундаж</th>
                  <th className="p-3 text-center">Самбар</th>
                  <th className="p-3 text-center">Дамжуулалт</th>
                  <th className="p-3 text-center">Таслалт</th>
                  <th className="p-3 text-center">Хаалт</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((row, index) => {
                  return (
                    <tr
                      key={row.player_id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-3 font-medium">{index + 1}</td>
                      <td className="p-3">
                        <span className="font-medium">{row.player_name}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.team_name}
                      </td>
                      <td className="p-3 text-center">{row.gp}</td>
                      <td className="p-3 text-center font-medium">
                        {row.pts?.toFixed(1) ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        {row.points_per_game?.toFixed(1) ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        {row.rebounds_per_game?.toFixed(1) ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        {row.assists_per_game?.toFixed(1) ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        {row.stl?.toFixed(1) ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        {row.blk?.toFixed(1) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {leaders.length < 10 && (
            <p className="mt-2 text-sm text-muted-foreground">
              * Лигийн хангалттай тоглолтод оролцсон тоглогчдын жагсаалт.
            </p>
          )}
        </section>
      )}

      {/* Empty state */}
      {standings.length === 0 && leaders.length === 0 && (
        <PublicEmptyState
          icon={FileDown}
          title="Мэдээлэл байхгүй"
          description="Энэ тэмцээний тайлан бүрдээгүй байна."
          actionHref={`/standings?competition=${competitionId}`}
          actionLabel="Шалгуур харах"
        />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .report-page {
            max-width: 100% !important;
            padding: 0 !important;
          }
          .report-table th,
          .report-table td {
            padding: 6px 8px !important;
            font-size: 10px !important;
          }
          .report-table th {
            background: #f5f5f5 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .court-divider {
            break-inside: avoid !important;
          }
          section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          h2 {
            margin-top: 16px !important;
          }
          body {
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
        }
        @media screen {
          .report-page {
            padding-bottom: 6rem !important;
          }
        }
      `}</style>
    </main>
  );
}
