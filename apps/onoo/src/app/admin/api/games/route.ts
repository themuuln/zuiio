import { createRouteHandlers } from "@/lib/supabase/admin-route";

const GAME_SELECT =
  "*, competitions(name, season_id), home_team_season:team_seasons!home_team_season_id(teams(name, short_code)), away_team_season:team_seasons!away_team_season_id(teams(name, short_code)), venues(name, city)";

const games = createRouteHandlers("games", { select: GAME_SELECT });

export const GET = games.list();

export const POST = games.create((body) => {
  const {
    competition_id,
    home_team_season_id,
    away_team_season_id,
    venue_id,
    scheduled_at,
  } = body;
  if (
    !competition_id ||
    !home_team_season_id ||
    !away_team_season_id ||
    !scheduled_at
  ) {
    return {
      insert: body,
      validate:
        "competition_id, home_team_season_id, away_team_season_id, and scheduled_at are required",
    };
  }
  return {
    competition_id,
    home_team_season_id,
    away_team_season_id,
    venue_id: venue_id ?? null,
    scheduled_at,
  };
});
