import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type AnalyticsPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: AnalyticsPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} - Шинжилгээ - Оноо` };
}

export default async function TeamAnalyticsPage({
  params,
}: AnalyticsPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (teamError || !team) notFound();

  // Get team seasons
  const { data: teamSeasons } = await supabase
    .from("team_seasons")
    .select(`
      id,
      season:seasons (id, name),
      league:leagues (name)
    `)
    .eq("team_id", team.id);

  // Get aggregated stats
  const { data: gameStats } = await supabase
    .from("game_team_stats")
    .select("*")
    .in(
      "team_season_id",
      teamSeasons?.map((ts) => ts.id) || []
    );

  // Calculate aggregates
  const totalGames = gameStats?.length || 0;
  const totalWins =
    gameStats?.filter((g) => (g.pts || 0) > (g.pts_allowed || 0)).length || 0;
  const totalPts = gameStats?.reduce((sum, g) => sum + (g.pts || 0), 0) || 0;
  const totalPtsAllowed =
    gameStats?.reduce((sum, g) => sum + (g.pts_allowed || 0), 0) || 0;

  const stats = {
    games: totalGames,
    wins: totalWins,
    losses: totalGames - totalWins,
    winPct: totalGames > 0 ? (totalWins / totalGames).toFixed(3) : ".000",
    avgPts: totalGames > 0 ? (totalPts / totalGames).toFixed(1) : "0.0",
    avgPtsAllowed:
      totalGames > 0 ? (totalPtsAllowed / totalGames).toFixed(1) : "0.0",
    avgDiff:
      totalGames > 0
        ? ((totalPts - totalPtsAllowed) / totalGames).toFixed(1)
        : "0.0",
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/teams/${slug}`}
          className="text-sm text-primary hover:underline"
        >
          ← Буцах
        </Link>
        <h1 className="text-2xl font-bold">{team.name} - Шинжилгээ</h1>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Тоглолт
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.games}</div>
            <p className="text-xs text-muted-foreground">
              {stats.wins} Ялалт / {stats.losses} Хожигдолт
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Ялалтын хувь
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winPct}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Дундаж оноо
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPts}</div>
            <p className="text-xs text-muted-foreground">
              Өрсөлдөгчдийн: {stats.avgPtsAllowed}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Онооны зөрүү
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                Number(stats.avgDiff) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {Number(stats.avgDiff) >= 0 ? "+" : ""}
              {stats.avgDiff}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seasons */}
      <Card>
        <CardHeader>
          <CardTitle>Улирлууд</CardTitle>
        </CardHeader>
        <CardContent>
          {teamSeasons && teamSeasons.length > 0 ? (
            <div className="space-y-2">
              {teamSeasons.map((ts) => {
                const season = ts.season as { name?: string } | null;
                const league = ts.league as { name?: string } | null;
                const seasonStats = gameStats?.filter(
                  (g) => g.team_season_id === ts.id
                );
                const games = seasonStats?.length || 0;
                const wins =
                  seasonStats?.filter((g) => (g.pts || 0) > (g.pts_allowed || 0))
                    .length || 0;

                return (
                  <div
                    key={ts.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{season?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {league?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {wins}-{games - wins}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {games > 0
                          ? ((wins / games) * 100).toFixed(0)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">Улирал байхгүй</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
