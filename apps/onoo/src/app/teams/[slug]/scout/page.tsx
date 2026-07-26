import { ArrowLeft, Eye, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  aggregateTeamStats,
  getTeamBySlug,
  getTeamGameStats,
} from "@/app/lib/data";
import type { LeaderRow } from "@/app/lib/shared";
import { TeamLogo } from "@/components/team-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { PrintButton } from "./print-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("mn-MN", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formDot(result: "W" | "L", i: number) {
  return (
    <span
      key={i}
      className={cn(
        "size-2.5 rounded-full",
        result === "W" ? "bg-emerald-500" : "bg-red-400",
      )}
      title={result === "W" ? "Ялалт" : "Ялагдал"}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ScoutPage({ params }: PageProps) {
  const { slug } = await params;
  const teamData = await getTeamBySlug(slug);

  if (!teamData?.team) {
    notFound();
  }

  const { team, standings, upcomingGames } = teamData;

  if (upcomingGames.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/teams/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {team.name} руу буцах
        </Link>
        <div className="mt-8 text-center">
          <Eye className="mx-auto size-12 text-muted-foreground/50" />
          <h1 className="mt-4 text-xl font-bold">Скаутын тайлан</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Дараагийн тоглолт товлогдоогүй байна. Тоглолт товлогдсоны дараа
            өрсөлдөгчийн дэлгэрэнгүй мэдээлэл энд харагдана.
          </p>
        </div>
      </div>
    );
  }

  const nextGame = upcomingGames[0];
  if (!nextGame) return null;
  const isHome = nextGame.home_team_slug === slug;
  const opponentSlug = isHome
    ? nextGame.away_team_slug
    : nextGame.home_team_slug;
  const opponentShortCode = isHome
    ? nextGame.away_team_short_code
    : nextGame.home_team_short_code;
  const opponentLogoUrl = isHome
    ? nextGame.away_team_logo_url
    : nextGame.home_team_logo_url;

  // Fetch opponent data + advanced stats
  const [opponentData, myTeamGames, oppGames] = await Promise.all([
    getTeamBySlug(opponentSlug),
    getTeamGameStats(team.team_season_id),
    getTeamBySlug(opponentSlug).then((opp) =>
      opp ? getTeamGameStats(opp.team.team_season_id) : [],
    ),
  ]);

  const myAgg = aggregateTeamStats(myTeamGames);
  const oppAgg = aggregateTeamStats(oppGames);
  const _opponentName = opponentData?.team.name ?? opponentSlug;

  // Fetch opponent top players
  const supabase = await createClient();
  const { data: oppLeadersRaw } = await supabase
    .from("v_public_leaders")
    .select("*")
    .eq("team_slug", opponentSlug)
    .eq("qualified", true)
    .order("pts", { ascending: false })
    .limit(5);
  const oppLeaders = (oppLeadersRaw ?? []) as unknown as LeaderRow[];

  // Opponent recent form
  const oppForm = opponentData
    ? opponentData.recentGames.slice(0, 5).map((g) => {
        const isOppHome = g.home_team_slug === opponentSlug;
        const oppScore = isOppHome ? (g.home_score ?? 0) : (g.away_score ?? 0);
        const oppConceded = isOppHome
          ? (g.away_score ?? 0)
          : (g.home_score ?? 0);
        return oppScore > oppConceded ? ("W" as const) : ("L" as const);
      })
    : [];

  // Stat duel comparison
  const statDuel: Array<{
    label: string;
    myValue: number;
    oppValue: number;
    higherIsBetter: boolean;
  }> = [
    {
      label: "ORtg",
      myValue: myAgg.avg_ortg,
      oppValue: oppAgg.avg_ortg,
      higherIsBetter: true,
    },
    {
      label: "DRtg",
      myValue: myAgg.avg_drtg,
      oppValue: oppAgg.avg_drtg,
      higherIsBetter: false,
    },
    {
      label: "NetRtg",
      myValue: myAgg.avg_net_rtg,
      oppValue: oppAgg.avg_net_rtg,
      higherIsBetter: true,
    },
    {
      label: "Pace",
      myValue: myAgg.avg_pace,
      oppValue: oppAgg.avg_pace,
      higherIsBetter: false,
    },
    {
      label: "eFG%",
      myValue: myAgg.avg_efg,
      oppValue: oppAgg.avg_efg,
      higherIsBetter: true,
    },
    {
      label: "OREB%",
      myValue: myAgg.avg_oreb_pct,
      oppValue: oppAgg.avg_oreb_pct,
      higherIsBetter: true,
    },
  ];
  const activeDuels = statDuel.filter((d) => d.myValue > 0 || d.oppValue > 0);
  const maxStat = Math.max(
    ...activeDuels.map((d) => Math.max(d.myValue, d.oppValue)),
    1,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={`/teams/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {team.name} руу буцах
      </Link>

      {/* Header: vs opponent */}
      <div className="mt-6 rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Дараагийн тоглолт · {nextGame.competition_name}
          </p>
          <PrintButton />
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          {/* My team */}
          <div className="flex flex-col items-center gap-2">
            <TeamLogo
              logoUrl={team.logo_url}
              shortCode={team.short_code}
              size="lg"
              primaryColor={team.primary_color}
            />
            <p className="text-sm font-semibold">{team.short_code}</p>
            <p className="text-xs text-muted-foreground">
              {standings ? `${standings.w}–${standings.l}` : "—"}
            </p>
          </div>

          {/* VS */}
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground/50">VS</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(nextGame.scheduled_at)}
            </p>
            <Badge variant="outline" className="mt-1">
              {isHome ? "Өөрийн талбайд" : "Айлын талбайд"}
            </Badge>
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-2">
            <TeamLogo
              logoUrl={opponentLogoUrl}
              shortCode={opponentShortCode}
              size="lg"
            />
            <p className="text-sm font-semibold">{opponentShortCode}</p>
            <p className="text-xs text-muted-foreground">
              {opponentData?.standings
                ? `${opponentData.standings.w}–${opponentData.standings.l}`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Stat comparison */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-4" />
              Багийн үзүүлэлтийн харьцуулалт
            </CardTitle>
            <CardDescription>
              {team.short_code} (өөрийн) vs {opponentShortCode} (өрсөлдөгч)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeDuels.map((duel) => {
                const myLeads = duel.higherIsBetter
                  ? duel.myValue >= duel.oppValue
                  : duel.myValue <= duel.oppValue;
                const barW = (val: number) =>
                  maxStat > 0 ? (val / maxStat) * 100 : 0;
                return (
                  <div key={duel.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span
                        className={cn(
                          "font-medium",
                          myLeads
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {duel.myValue.toFixed(1)}
                      </span>
                      <span className="font-semibold text-foreground">
                        {duel.label}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          !myLeads
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {duel.oppValue.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex h-3 gap-0.5">
                      <div
                        className={cn(
                          "rounded-l-full transition-all",
                          myLeads ? "bg-emerald-500" : "bg-muted-foreground/30",
                        )}
                        style={{ width: `${barW(duel.myValue)}%` }}
                      />
                      <div
                        className={cn(
                          "rounded-r-full transition-all",
                          !myLeads
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/30",
                        )}
                        style={{ width: `${barW(duel.oppValue)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Players to watch */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-4" />
              Анхаарах тоглогчид
            </CardTitle>
            <CardDescription>
              {opponentShortCode} багийн тэргүүлэх тоглогчид
            </CardDescription>
          </CardHeader>
          <CardContent>
            {oppLeaders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Өгөгдөл бэлэн болоогүй байна.
              </p>
            ) : (
              <div className="space-y-3">
                {oppLeaders.map((player, i) => (
                  <Link
                    key={player.player_id}
                    href={`/players/${player.player_id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {player.player_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {player.player_position ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {player.pts ?? 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">PPG</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent form + key numbers */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Сүүлийн 5 тоглолт</CardTitle>
            <CardDescription>{opponentShortCode} багийн форм</CardDescription>
          </CardHeader>
          <CardContent>
            {oppForm.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Тоглолтын түүх бэлэн болоогүй байна.
              </p>
            ) : (
              <div className="flex items-center gap-2">
                {oppForm.map((result, i) => formDot(result, i))}
                <span className="ml-2 text-xs text-muted-foreground">
                  {oppAgg.wins}–{oppAgg.losses}
                </span>
              </div>
            )}
          </CardContent>
          <CardHeader>
            <CardTitle className="text-lg">Гол үзүүлэлтүүд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold">
                  {myAgg.avg_ortg.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {team.short_code} ORtg
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold">
                  {oppAgg.avg_ortg.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {opponentShortCode} ORtg
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold">
                  {myAgg.avg_drtg.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {team.short_code} DRtg
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold">
                  {oppAgg.avg_drtg.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {opponentShortCode} DRtg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
