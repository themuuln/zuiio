import { withAuth } from "@/lib/supabase/admin-route";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("team_transactions")
      .select("*, team_seasons(id, teams(name))")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { team_season_id, type, description, amount_mnt, due_date } = body;

    if (!team_season_id || !type || !description || amount_mnt == null) {
      return NextResponse.json(
        { error: "team_season_id, type, description, and amount_mnt are required" },
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
      .from("team_transactions")
      .insert({
        team_season_id,
        type,
        description,
        amount_mnt,
        created_by: session.user.id,
      })
      .select("*, team_seasons(id, teams(name))")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("team_transactions")
      .update({ paid_at: new Date().toISOString(), paid_by: session.user.id })
      .eq("id", id)
      .select("*, team_seasons(id, teams(name))")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}
