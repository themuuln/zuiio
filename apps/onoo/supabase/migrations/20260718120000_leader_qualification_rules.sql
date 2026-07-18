-- Add qualification rules to v_public_leaders:
-- A player qualifies when gp >= GREATEST(3, CEIL(0.5 * team_games_played))
-- This prevents a single hot game from topping a per-game leaderboard.

-- 1. Drop dependent view first
DROP VIEW IF EXISTS public.v_public_team_roster CASCADE;

-- 2. Recreate v_public_leaders with qualification columns
DROP VIEW IF EXISTS public.v_public_leaders CASCADE;
CREATE VIEW public.v_public_leaders
WITH (security_invoker = true) AS
SELECT
  sps.competition_id, c.name AS competition_name,
  s.id AS season_id, l.id AS league_id,
  sps.player_id,
  CASE WHEN p.visibility = 'hidden' THEN 'Нэргүй тоглогч' ELSE p.canonical_name END AS player_name,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.name_latin END AS player_name_latin,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.position END AS player_position,
  sps.team_season_id, ts.team_id, t.name AS team_name,
  sps.gp, sps.mpg, sps.pts,
  sps.fgm, sps.fga, sps.tpm, sps.tpa, sps.ftm, sps.fta,
  sps.oreb, sps.dreb, sps.ast, sps.stl, sps.blk, sps.tov, sps.pf,
  s.name AS season_name,
  l.name AS league_name,
  l.slug AS league_slug,
  t.slug AS team_slug,
  t.short_code AS team_short_code,
  t.logo_url AS team_logo_url,
  t.primary_color AS team_primary_color,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.photo_url END AS player_photo_url,
  COALESCE(team_stats.team_games_played, 0)::integer AS team_games_played,
  (
    sps.gp >= GREATEST(3, CEIL(0.5 * COALESCE(team_stats.team_games_played, 0)))
  ) AS qualified
FROM public.season_player_stats sps
JOIN public.competitions c ON c.id = sps.competition_id
JOIN public.seasons s ON s.id = c.season_id
JOIN public.leagues l ON l.id = s.league_id
JOIN public.players p ON p.id = sps.player_id
JOIN public.team_seasons ts ON ts.id = sps.team_season_id
JOIN public.teams t ON t.id = ts.team_id
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS team_games_played
  FROM public.games g
  WHERE g.competition_id = sps.competition_id
    AND g.status IN ('league_verified', 'official')
    AND (g.home_team_season_id = sps.team_season_id OR g.away_team_season_id = sps.team_season_id)
) team_stats ON true
WHERE EXISTS (
  SELECT 1 FROM public.games g
  WHERE g.competition_id = sps.competition_id AND g.status IN ('league_verified', 'official')
);

-- 3. Recreate v_public_team_roster (depends on v_public_leaders)
CREATE VIEW public.v_public_team_roster
WITH (security_invoker = true) AS
SELECT
  ts.id AS team_season_id,
  ts.competition_id,
  ts.team_id,
  t.name AS team_name,
  t.slug AS team_slug,
  re.id AS roster_entry_id,
  re.jersey_number,
  re.position AS roster_position,
  p.id AS player_id,
  CASE WHEN p.visibility = 'hidden' THEN 'Нэргүй тоглогч' ELSE p.canonical_name END AS player_name,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.name_latin END AS player_name_latin,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.position END AS player_position,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.photo_url END AS photo_url,
  t.short_code AS team_short_code,
  t.logo_url AS team_logo_url,
  t.primary_color AS team_primary_color
FROM public.team_seasons ts
JOIN public.teams t ON t.id = ts.team_id
JOIN public.roster_entries re ON re.team_season_id = ts.id AND re.left_at IS NULL
JOIN public.players p ON p.id = re.player_id;

-- 4. Re-grant permissions
GRANT SELECT ON public.v_public_games, public.v_public_live_games,
  public.v_public_standings, public.v_public_leaders,
  public.v_public_team_roster, public.v_public_player_profiles
TO anon, authenticated;
