import { createRouteHandlers } from "@/lib/supabase/admin-route";

const GAME_SELECT =
  "*, competitions(name, season_id), home_team_season:team_seasons!home_team_season_id(teams(name, short_code)), away_team_season:team_seasons!away_team_season_id(teams(name, short_code)), venues(name, city)";

const games = createRouteHandlers("games", { select: GAME_SELECT });

export const GET = games.getById();

// Games updates only allow changing the status
export const PUT = games.update((body) => ({ status: body.status }));

export const DELETE = games.remove();
