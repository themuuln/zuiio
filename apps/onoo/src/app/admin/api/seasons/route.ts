import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leagueId = request.nextUrl.searchParams.get("league_id");

  let query = supabase.from("seasons").select("*, leagues(name)");

  if (leagueId) {
    query = query.eq("league_id", leagueId);
  }

  const { data, error } = await query;

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
  const { league_id, name, starts_on, ends_on } = body;

  if (!league_id || !name) {
    return NextResponse.json(
      { error: "league_id and name are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("seasons")
    .insert({
      league_id,
      name,
      starts_on: starts_on ?? null,
      ends_on: ends_on ?? null,
    })
    .select("*, leagues(name)")
    .single();

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
