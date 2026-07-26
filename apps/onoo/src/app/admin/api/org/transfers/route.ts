import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = new URL(request.url);
    const teamSeasonId = searchParams.get("team_season_id");
    const playerId = searchParams.get("player_id");

    let query = supabase
      .from("transfers")
      .select(
        "*, players(canonical_name), teams_from:team_seasons!from_team_season_id(team_id, teams(name)), teams_to:team_seasons!to_team_season_id(team_id, teams(name))",
      );
    if (teamSeasonId)
      query = query.or(
        `from_team_season_id.eq.${teamSeasonId},to_team_season_id.eq.${teamSeasonId}`,
      );
    if (playerId) query = query.eq("player_id", playerId);
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const {
      player_id,
      from_team_season_id,
      to_team_season_id,
      transfer_type,
      effective_from,
      note,
    } = body;

    if (!player_id || !to_team_season_id || !transfer_type || !effective_from) {
      return NextResponse.json(
        {
          error:
            "player_id, to_team_season_id, transfer_type, and effective_from are required",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("cmd_record_transfer", {
      p_player_id: player_id,
      p_from_team_season_id: from_team_season_id || null,
      p_to_team_season_id: to_team_season_id,
      p_transfer_type: transfer_type,
      p_effective_from: effective_from,
      p_note: note || null,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}
