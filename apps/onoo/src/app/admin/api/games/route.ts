import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GAME_SELECT =
  "*, competitions(name, season_id), home_team_season:team_seasons!home_team_season_id(teams(name, short_code)), away_team_season:team_seasons!away_team_season_id(teams(name, short_code)), venues(name, city)";

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("games").select(GAME_SELECT);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    competition_id,
    home_team_season_id,
    away_team_season_id,
    venue_id,
    scheduled_at,
  } = body;

  if (
    !competition_id ||
    !home_team_season_id ||
    !away_team_season_id ||
    !scheduled_at
  ) {
    return NextResponse.json(
      {
        error:
          "competition_id, home_team_season_id, away_team_season_id, and scheduled_at are required",
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("games")
    .insert({
      competition_id,
      home_team_season_id,
      away_team_season_id,
      venue_id: venue_id ?? null,
      scheduled_at,
    })
    .select(GAME_SELECT)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
