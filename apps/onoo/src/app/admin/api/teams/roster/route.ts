import { withAuth } from "@/lib/supabase/admin-route";
import { type NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = new URL(request.url);
    const teamSeasonId = searchParams.get("team_season_id");

    if (!teamSeasonId) {
      return NextResponse.json(
        { error: "team_season_id query parameter is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("roster_snapshots")
      .select("*, players(canonical_name, photo_url)")
      .eq("team_season_id", teamSeasonId)
      .order("jersey_number", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { team_season_id } = body;

    if (!team_season_id) {
      return NextResponse.json(
        { error: "team_season_id is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("cmd_snapshot_roster", {
      p_team_season_id: team_season_id,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    const { error } = await supabase.from("roster_snapshots").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  });
}
