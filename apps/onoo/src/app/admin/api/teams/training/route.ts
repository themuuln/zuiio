import { withAuth } from "@/lib/supabase/admin-route";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("training_sessions")
      .select("*, team_seasons(id, teams(name))")
      .order("scheduled_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { team_season_id, title, description, location, scheduled_at, duration_minutes } = body;

    if (!team_season_id || !title || !scheduled_at || !duration_minutes) {
      return NextResponse.json(
        { error: "team_season_id, title, scheduled_at, and duration_minutes are required" },
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
      .from("training_sessions")
      .insert({
        team_season_id,
        title,
        description: description ?? null,
        location: location ?? null,
        scheduled_at,
        duration_minutes,
        created_by: session.user.id,
      })
      .select("*, team_seasons(id, teams(name))")
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

    const { error } = await supabase.from("training_sessions").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  });
}
