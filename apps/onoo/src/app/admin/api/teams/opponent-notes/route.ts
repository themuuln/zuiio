import { withAuth } from "@/lib/supabase/admin-route";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const teamSeasonId = request.nextUrl.searchParams.get("team_season_id");

    let query = supabase
      .from("opponent_notes")
      .select(
        "*, team_seasons!opponent_notes_team_season_id_fkey(id, teams(name)), opponent_team:team_seasons!opponent_notes_opponent_team_season_id_fkey(id, teams(name))",
      )
      .order("created_at", { ascending: false });

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
    const { team_season_id, opponent_team_season_id, notes, game_plan, strengths, weaknesses } =
      body;

    if (!team_season_id || !opponent_team_season_id) {
      return NextResponse.json(
        { error: "team_season_id and opponent_team_season_id are required" },
        { status: 400 },
      );
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("opponent_notes")
      .insert({
        team_season_id,
        opponent_team_season_id,
        notes: notes ?? null,
        game_plan: game_plan ?? null,
        strengths: strengths ?? null,
        weaknesses: weaknesses ?? null,
        created_by: session.user.id,
      })
      .select(
        "*, team_seasons!opponent_notes_team_season_id_fkey(id, teams(name)), opponent_team:team_seasons!opponent_notes_opponent_team_season_id_fkey(id, teams(name))",
      )
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { id, notes, game_plan, strengths, weaknesses } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (notes !== undefined) updates.notes = notes;
    if (game_plan !== undefined) updates.game_plan = game_plan;
    if (strengths !== undefined) updates.strengths = strengths;
    if (weaknesses !== undefined) updates.weaknesses = weaknesses;

    const { data, error } = await supabase
      .from("opponent_notes")
      .update(updates)
      .eq("id", id)
      .select(
        "*, team_seasons!opponent_notes_team_season_id_fkey(id, teams(name)), opponent_team:team_seasons!opponent_notes_opponent_team_season_id_fkey(id, teams(name))",
      )
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}
