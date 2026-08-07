-- ============================================================================
-- Social links for players, teams, competitions, and organizations
-- ============================================================================

-- ── Add social_links column to players ─────────────────────────────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── Add social_links column to teams ───────────────────────────────────
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── Add social_links column to competitions ────────────────────────────
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── Add social_links column to organizations ───────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── Update v_public_player_profiles to include social_links ───────────
DROP VIEW IF EXISTS public.v_public_player_profiles CASCADE;

CREATE VIEW public.v_public_player_profiles
WITH (security_invoker = true) AS
SELECT
  p.id AS player_id,
  CASE WHEN p.visibility = 'hidden' THEN 'Нэргүй тоглогч' ELSE p.canonical_name END AS player_name,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.name_latin END AS player_name_latin,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.dob END AS dob,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.height_cm END AS height_cm,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.weight_kg END AS weight_kg,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.position END AS player_position,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.nationality END AS nationality,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.photo_url END AS photo_url,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.social_links END AS social_links,
  ts.id AS team_season_id,
  ts.team_id,
  t.name AS team_name,
  t.slug AS team_slug,
  t.logo_url AS team_logo_url,
  t.short_code AS team_short_code,
  t.primary_color AS team_primary_color,
  ts.competition_id,
  c.name AS competition_name,
  s.id AS season_id,
  s.name AS season_name,
  l.id AS league_id,
  l.name AS league_name,
  l.slug AS league_slug,
  re.jersey_number,
  COALESCE(sps.gp, 0)::integer AS games_played,
  sps.mpg AS minutes_per_game,
  sps.pts AS points_per_game,
  sps.fgm AS fgm_per_game,
  sps.fga AS fga_per_game,
  sps.tpm AS tpm_per_game,
  sps.tpa AS tpa_per_game,
  sps.ftm AS ftm_per_game,
  sps.oreb AS oreb_per_game,
  sps.dreb AS dreb_per_game,
  sps.fta AS fta_per_game,
  sps.ast AS ast_per_game,
  sps.stl AS stl_per_game,
  sps.blk AS blk_per_game,
  sps.tov AS tov_per_game,
  sps.pf AS pf_per_game
FROM public.players p
JOIN public.roster_entries re ON re.player_id = p.id AND re.left_at IS NULL
JOIN public.team_seasons ts ON ts.id = re.team_season_id
JOIN public.teams t ON t.id = ts.team_id
JOIN public.competitions c ON c.id = ts.competition_id
JOIN public.seasons s ON s.id = c.season_id
JOIN public.leagues l ON l.id = s.league_id
LEFT JOIN public.season_player_stats sps
  ON sps.player_id = p.id AND sps.competition_id = ts.competition_id
WHERE EXISTS (
  SELECT 1 FROM public.games g
  WHERE g.competition_id = ts.competition_id
    AND g.status IN ('league_verified', 'official')
);

-- ── Re-grant permissions ──────────────────────────────────────────────
GRANT SELECT ON public.v_public_player_profiles TO anon, authenticated;

-- ── Re-create views that depend on v_public_player_profiles ──────────

-- v_public_players — lean view for command-palette quick search
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
WHERE pp.player_name != 'Нэргүй тоглогч';

GRANT SELECT ON public.v_public_players TO anon, authenticated;

-- v_public_player_directory — rich view for the /players page
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

GRANT SELECT ON public.v_public_player_directory TO anon, authenticated;
