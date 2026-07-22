/**
 * Team advanced stats types (Phase 7 — Team performance dashboard).
 *
 * Extracted from shared.ts to keep that file focused on shared utilities
 * and common view-row types.
 */
export interface TeamGameStatsRow {
  game_id: string;
  scheduled_at: string;
  status: string;
  home_team_season_id: string;
  away_team_season_id: string;
  home_score: number | null;
  away_score: number | null;
  team_season_id: string;
  team_pts: number;
  team_fgm: number;
  team_fga: number;
  team_tpm: number;
  team_tpa: number;
  team_ftm: number;
  team_fta: number;
  team_oreb: number;
  team_dreb: number;
  team_ast: number;
  team_stl: number;
  team_blk: number;
  team_tov: number;
  team_pf: number;
  opp_pts: number;
  opp_fgm: number;
  opp_fga: number;
  opp_tpm: number;
  opp_tpa: number;
  opp_ftm: number;
  opp_fta: number;
  opp_oreb: number;
  opp_dreb: number;
  opp_ast: number;
  opp_stl: number;
  opp_blk: number;
  opp_tov: number;
  opp_pf: number;
  home_away: "home" | "away";
  opp_team_season_id: string;
  opp_team_name: string;
  opp_team_slug: string;
  opp_team_short_code: string;
  opp_team_logo_url: string | null;
}

export interface TeamAdvancedStatsPerGame {
  game_id: string;
  scheduled_at: string;
  opponent_name: string;
  opponent_slug: string;
  home_away: "home" | "away";
  team_score: number;
  opp_score: number;
  result: "W" | "L";
  ortg: number;
  drtg: number;
  net_rtg: number;
  pace: number;
  efg: number;
  tov_pct: number;
  oreb_pct: number;
  fta_rate: number;
  pie: number;
}

export interface TeamSeasonAggregates {
  games_played: number;
  avg_ortg: number;
  avg_drtg: number;
  avg_net_rtg: number;
  avg_pace: number;
  avg_efg: number;
  avg_tov_pct: number;
  avg_oreb_pct: number;
  avg_fta_rate: number;
  avg_pie: number;
  wins: number;
  losses: number;
}
