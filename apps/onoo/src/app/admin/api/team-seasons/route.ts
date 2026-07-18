import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const competitionId = request.nextUrl.searchParams.get("competition_id");

  let query = supabase
    .from("team_seasons")
    .select("id, team_id, competition_id, teams(name, short_code)");

  if (competitionId) {
    query = query.eq("competition_id", competitionId);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
