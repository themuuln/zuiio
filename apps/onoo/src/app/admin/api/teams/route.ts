import { createRouteHandlers } from "@/lib/supabase/admin-route";

const teams = createRouteHandlers("teams", { select: "*, leagues(name)" });

export const GET = teams.list((query, req) => {
  const leagueId = req.nextUrl.searchParams.get("league_id");
  return leagueId ? query.eq("league_id", leagueId) : query;
});

export const POST = teams.create((body) => {
  const { league_id, name, short_code, slug, primary_color, social_links } = body;
  if (!league_id || !name || !short_code || !slug) {
    return {
      insert: body,
      validate: "league_id, name, short_code, and slug are required",
    };
  }
  return {
    league_id,
    name,
    short_code,
    slug,
    primary_color: primary_color ?? null,
    social_links: social_links ?? {},
  };
});
