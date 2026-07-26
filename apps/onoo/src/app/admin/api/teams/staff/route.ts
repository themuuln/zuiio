import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("team_staff")
      .select("*, team_seasons(id, team_id, teams(name))")
      .order("created_at", { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { team_season_id, user_id, role } = body;

    if (!team_season_id || !user_id || !role) {
      return NextResponse.json(
        { error: "team_season_id, user_id, and role are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("cmd_assign_team_staff", {
      p_team_season_id: team_season_id,
      p_user_id: user_id,
      p_role: role,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    const { error } = await supabase.from("team_staff").delete().eq("id", id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  });
}
