import { withAuth } from "@/lib/supabase/admin-route";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const teamSeasonId = request.nextUrl.searchParams.get("team_season_id");

    let query = supabase
      .from("roster_availability")
      .select("*, players(canonical_name)")
      .order("game_date", { ascending: true });

    if (teamSeasonId) {
      query = query.eq("team_season_id", teamSeasonId);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { team_season_id, player_id, game_date, status, note } = body;

    if (!team_season_id || !player_id || !game_date || !status) {
      return NextResponse.json(
        { error: "team_season_id, player_id, game_date, and status are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("roster_availability")
      .upsert(
        {
          team_season_id,
          player_id,
          game_date,
          status,
          note: note ?? null,
        },
        {
          onConflict: "team_season_id, player_id, game_date",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase.from("roster_availability").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  });
}
