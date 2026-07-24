-- ============================================================================
-- Public player views for search functionality (T-3.8)
-- ============================================================================

-- v_public_players — lean view for command-palette quick search
-- Column names match quick search query expectations
CREATE OR REPLACE VIEW public.v_public_players
WITH (security_invoker = true)
AS
SELECT
  pp.player_id AS id,
  pp.player_name AS canonical_name,
  pp.player_name_latin AS name_latin,
  pp.photo_url,
  pp.team_name,
  pp.team_slug,
  pp.team_short_code AS short_code
FROM public.v_public_player_profiles pp
-- Exclude hidden players entirely (view masks them as "Нэргүй тоглогч")
WHERE pp.player_name != 'Нэргүй тоглогч';

-- v_public_player_directory — rich view for the global search /players page
-- Provides per-game stats like v_public_player_profiles but with computed
-- rebounds = oreb + dreb
CREATE OR REPLACE VIEW public.v_public_player_directory
WITH (security_invoker = true)
AS
SELECT
  pp.player_id,
  pp.player_name,
  pp.player_name_latin,
  pp.player_position,
  pp.photo_url,
  pp.team_name,
  pp.team_slug,
  pp.team_short_code,
  pp.team_logo_url,
  pp.team_primary_color,
  pp.games_played,
  pp.points_per_game,
  COALESCE(pp.oreb_per_game, 0) + COALESCE(pp.dreb_per_game, 0) AS rebounds_per_game,
  pp.ast_per_game AS assists_per_game
FROM public.v_public_player_profiles pp
WHERE pp.player_name != 'Нэргүй тоглогч';
