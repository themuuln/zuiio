import { createRouteHandlers } from "@/lib/supabase/admin-route";

const seasons = createRouteHandlers("seasons", { select: "*, leagues(name)" });

export const GET = seasons.list((query, req) => {
  const leagueId = req.nextUrl.searchParams.get("league_id");
  return leagueId ? query.eq("league_id", leagueId) : query;
});

export const POST = seasons.create((body) => {
  const { league_id, name, starts_on, ends_on } = body;
  if (!league_id || !name) {
    return { insert: body, validate: "league_id and name are required" };
  }
  return {
    league_id,
    name,
    starts_on: starts_on ?? null,
    ends_on: ends_on ?? null,
  };
});
