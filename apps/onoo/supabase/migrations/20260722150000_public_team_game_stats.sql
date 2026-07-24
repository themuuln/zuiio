-- ============================================================================
-- v_public_team_game_stats — per-game team stats with opponent pairing
-- Each row is one team's perspective: their stats + opponent stats + game info
-- Supports ORtg/DRtg computation in application layer
-- ============================================================================

CREATE OR REPLACE VIEW public.v_public_team_game_stats
WITH (security_invoker = true)
AS
SELECT
  g.id AS game_id,
  g.scheduled_at,
  g.status,
  g.home_team_season_id,
  g.away_team_season_id,
  g.home_score,
  g.away_score,

  -- Team (perspective) stats
  t.team_season_id,
  t.pts AS team_pts,
  t.fgm AS team_fgm,
  t.fga AS team_fga,
  t.tpm AS team_tpm,
  t.tpa AS team_tpa,
  t.ftm AS team_ftm,
  t.fta AS team_fta,
  t.oreb AS team_oreb,
  t.dreb AS team_dreb,
  t.ast AS team_ast,
  t.stl AS team_stl,
  t.blk AS team_blk,
  t.tov AS team_tov,
  t.pf AS team_pf,

  -- Opponent stats
  o.pts AS opp_pts,
  o.fgm AS opp_fgm,
  o.fga AS opp_fga,
  o.tpm AS opp_tpm,
  o.tpa AS opp_tpa,
  o.ftm AS opp_ftm,
  o.fta AS opp_fta,
  o.oreb AS opp_oreb,
  o.dreb AS opp_dreb,
  o.ast AS opp_ast,
  o.stl AS opp_stl,
  o.blk AS opp_blk,
  o.tov AS opp_tov,
  o.pf AS opp_pf,

  -- Home/away designation
  CASE WHEN t.team_season_id = g.home_team_season_id THEN 'home' ELSE 'away' END AS home_away,

  -- Opponent team info
  o.team_season_id AS opp_team_season_id,
  opp_team.name AS opp_team_name,
  opp_team.slug AS opp_team_slug,
  opp_team.short_code AS opp_team_short_code,
  opp_team.logo_url AS opp_team_logo_url

FROM games g
JOIN game_team_stats t ON t.game_id = g.id
JOIN game_team_stats o ON o.game_id = g.id AND o.team_season_id != t.team_season_id
JOIN team_seasons opp_ts ON opp_ts.id = o.team_season_id
JOIN teams opp_team ON opp_team.id = opp_ts.team_id
WHERE g.status IN ('league_verified', 'official');
