import { withAuth } from "@/lib/supabase/admin-route";
import { NextResponse } from "next/server";

interface CatalogReference {
  competitions: unknown[];
  seasons: unknown[];
  sports: unknown[];
  leagues: unknown[];
  venues: unknown[];
  players: unknown[];
}

export const GET = () =>
  withAuth<CatalogReference>(async (supabase) => {
    const [competitions, seasons, sports, leagues, venues, players] =
      await Promise.all([
        supabase
          .from("competitions")
          .select("id, name, type, season_id, created_at")
          .order("name"),
        supabase
          .from("seasons")
          .select("*, leagues(name)")
          .order("starts_on", { ascending: false }),
        supabase.from("sports").select("id, key, name_mn, name_en").order("name_en"),
        supabase
          .from("leagues")
          .select("*, sports(name_en, name_mn)")
          .order("name"),
        supabase.from("venues").select("id, name, city, capacity").order("name"),
        supabase.from("players").select("*").order("canonical_name"),
      ]);

    if (competitions.error)
      return NextResponse.json(
        { error: competitions.error.message },
        { status: 500 },
      ) as never;
    if (seasons.error)
      return NextResponse.json(
        { error: seasons.error.message },
        { status: 500 },
      ) as never;
    if (sports.error)
      return NextResponse.json(
        { error: sports.error.message },
        { status: 500 },
      ) as never;
    if (leagues.error)
      return NextResponse.json(
        { error: leagues.error.message },
        { status: 500 },
      ) as never;
    if (venues.error)
      return NextResponse.json(
        { error: venues.error.message },
        { status: 500 },
      ) as never;
    if (players.error)
      return NextResponse.json(
        { error: players.error.message },
        { status: 500 },
      ) as never;

    return NextResponse.json({
      competitions: (competitions.data ?? []) as unknown as unknown[],
      seasons: (seasons.data ?? []) as unknown as unknown[],
      sports: (sports.data ?? []) as unknown as unknown[],
      leagues: (leagues.data ?? []) as unknown as unknown[],
      venues: (venues.data ?? []) as unknown as unknown[],
      players: (players.data ?? []) as unknown as unknown[],
    });
  });
