import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  aggregateTeamStats,
  getTeamBySlug,
  getTeamGameStats,
} from "@/app/lib/data";
import { PerGameTable } from "./components/per-game-table";
import { TeamStatsSummary } from "./components/team-stats-summary";
import { EfficiencyChartWrapper as EfficiencyChart } from "./components/efficiency-chart-wrapper";
import { FourFactorsChartWrapper as FourFactorsChart } from "./components/four-factors-chart-wrapper";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TeamAnalyticsPage({ params }: PageProps) {
  const { slug } = await params;
  const teamData = await getTeamBySlug(slug);

  if (!teamData?.team) {
    notFound();
  }

  const { team } = teamData;

  const teamSeasonId = teamData.standings?.team_season_id;
  const games = teamSeasonId ? await getTeamGameStats(teamSeasonId) : [];
  const aggregates = aggregateTeamStats(games);

  // TODO(7.2): Compute league-wide averages from all teams' game stats
  // and pass as leagueAverages to FourFactorsChart
  const leagueAverages = undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <Link
          href={`/teams/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {team.name} руу буцах
        </Link>
      </div>

      {/* Header */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {team.name} — Дэвшилтэт үзүүлэлтүүд
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ORtg, DRtg, NetRTG, Pace, Four Factors, PIE — тоглолт бүрээр
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Stat cards */}
          <TeamStatsSummary aggregates={aggregates} />

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <EfficiencyChart games={games} />
            <FourFactorsChart
              aggregates={aggregates}
              leagueAverages={leagueAverages}
            />
          </div>

          {/* Per-game table */}
          <PerGameTable games={games} />
        </div>
      </div>
    </div>
  );
}
