import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PublicLeaderRow {
  competition_id: string;
  player_id: string;
  team_id: string;
  team_name: string;
  gp: number;
  pts: number | null;
  fgm: number | null;
  fga: number | null;
  tpm: number | null;
  tpa: number | null;
  ftm: number | null;
  fta: number | null;
  oreb: number | null;
  dreb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
}

function percentage(made: number | null, attempted: number | null): number {
  if (!attempted) return 0;
  return ((made ?? 0) / attempted) * 100;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playerIds = (searchParams.get("playerIds") ?? "")
    .split(",")
    .filter(Boolean);
  const competitionId = searchParams.get("competitionId");

  if (playerIds.length !== 2 || new Set(playerIds).size !== 2) {
    return NextResponse.json(
      { error: "Хоёр өөр тоглогч сонгоно уу." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  let leadersQuery = supabase
    .from("v_public_leaders")
    .select("*")
    .in("player_id", playerIds);
  if (competitionId)
    leadersQuery = leadersQuery.eq("competition_id", competitionId);

  const [leadersResult, profilesResult] = await Promise.all([
    leadersQuery,
    supabase
      .from("v_public_player_profiles")
      .select("*")
      .in("player_id", playerIds),
  ]);

  if (leadersResult.error || profilesResult.error) {
    return NextResponse.json(
      {
        error:
          leadersResult.error?.message ??
          profilesResult.error?.message ??
          "Статистик ачаалж чадсангүй.",
      },
      { status: 500 },
    );
  }

  const leaderRows = (leadersResult.data ?? []) as PublicLeaderRow[];
  const result = playerIds.flatMap((playerId) => {
    const availableRows = leaderRows
      .filter((row) => row.player_id === playerId)
      .sort((a, b) => b.gp - a.gp);
    const stats = availableRows[0];
    const profile = (profilesResult.data ?? []).find(
      (row) =>
        row.player_id === playerId &&
        (!stats || row.competition_id === stats.competition_id),
    );
    if (!stats || !profile) return [];

    return [
      {
        id: playerId,
        name: profile.player_name,
        nameLatin: profile.player_name_latin,
        photoUrl: profile.photo_url,
        position: profile.player_position,
        team: {
          id: profile.team_id,
          name: profile.team_name,
          slug: profile.team_slug,
          shortCode:
            profile.team_short_code ??
            profile.team_name.slice(0, 3).toUpperCase(),
          logoUrl: profile.team_logo_url,
          primaryColor: profile.team_primary_color,
        },
        competition: {
          id: profile.competition_id,
          name: profile.competition_name,
          season: profile.season_name,
        },
        stats: {
          gamesPlayed: stats.gp,
          points: stats.pts ?? 0,
          rebounds: (stats.oreb ?? 0) + (stats.dreb ?? 0),
          assists: stats.ast ?? 0,
          steals: stats.stl ?? 0,
          blocks: stats.blk ?? 0,
          turnovers: stats.tov ?? 0,
          fieldGoalPercent: percentage(stats.fgm, stats.fga),
          threePointPercent: percentage(stats.tpm, stats.tpa),
          freeThrowPercent: percentage(stats.ftm, stats.fta),
          assistTurnoverRatio:
            (stats.tov ?? 0) > 0
              ? (stats.ast ?? 0) / (stats.tov ?? 1)
              : (stats.ast ?? 0),
        },
      },
    ];
  });

  if (result.length !== 2) {
    return NextResponse.json(
      { error: "Сонгосон тоглогчдын баталгаажсан статистик бүрдээгүй байна." },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
