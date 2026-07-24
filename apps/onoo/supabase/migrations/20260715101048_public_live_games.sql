-- Public schedule/live feed and media-rich discovery fields.
--
-- Public pages still read curated views only. The base games RLS policy is
-- widened solely so the security-invoker schedule view can expose safe game
-- metadata for scheduled, provisional, postponed, and cancelled games.

DROP POLICY IF EXISTS public_read_games ON public.games;
CREATE POLICY public_read_games
ON public.games
FOR SELECT
TO anon, authenticated
USING (
  status IN (
    'scheduled',
    'live_provisional',
    'final_pending_review',
    'league_verified',
    'official',
    'cancelled',
    'postponed'
  )
);

DROP VIEW IF EXISTS public.v_public_games CASCADE;
CREATE VIEW public.v_public_games
WITH (security_invoker = true) AS
SELECT
  g.id, g.competition_id, g.scheduled_at, g.status, g.current_period,
  g.home_score, g.away_score, g.current_revision_number, g.published_at, g.venue_id,
  v.name AS venue_name, c.name AS competition_name,
  s.id AS season_id, s.name AS season_name,
  l.id AS league_id, l.name AS league_name, l.slug AS league_slug,
  home.id AS home_team_season_id, home_team.id AS home_team_id, home_team.name AS home_team_name,
  home_team.slug AS home_team_slug, home_team.short_code AS home_team_short_code, home_team.logo_url AS home_team_logo_url,
  away.id AS away_team_season_id, away_team.id AS away_team_id, away_team.name AS away_team_name,
  away_team.slug AS away_team_slug, away_team.short_code AS away_team_short_code, away_team.logo_url AS away_team_logo_url,
  gr.id AS revision_id, gr.revision_number, gr.approved_at AS revision_approved_at,
  ss.id AS source_submission_id, ss.source_type, ss.evidence_url,
  ss.reviewed_by AS source_reviewer_id, ss.reviewed_at AS source_reviewed_at,
  home_team.primary_color AS home_team_primary_color,
  away_team.primary_color AS away_team_primary_color,
  false AS is_provisional
FROM public.games g
JOIN public.competitions c ON c.id = g.competition_id
JOIN public.seasons s ON s.id = c.season_id
JOIN public.leagues l ON l.id = s.league_id
LEFT JOIN public.venues v ON v.id = g.venue_id
JOIN public.team_seasons home ON home.id = g.home_team_season_id
JOIN public.teams home_team ON home_team.id = home.team_id
JOIN public.team_seasons away ON away.id = g.away_team_season_id
JOIN public.teams away_team ON away_team.id = away.team_id
JOIN public.game_revisions gr ON gr.game_id = g.id
  AND gr.revision_number = g.current_revision_number AND gr.state = 'approved'
JOIN public.source_submissions ss ON ss.id = gr.source_submission_id AND ss.status = 'approved'
WHERE g.status IN ('league_verified', 'official');

DROP VIEW IF EXISTS public.v_public_live_games CASCADE;
CREATE VIEW public.v_public_live_games
WITH (security_invoker = true) AS
SELECT
  g.id, g.competition_id, g.scheduled_at, g.status, g.current_period,
  g.home_score, g.away_score, g.current_revision_number, g.published_at, g.venue_id,
  v.name AS venue_name, c.name AS competition_name,
  s.id AS season_id, s.name AS season_name,
  l.id AS league_id, l.name AS league_name, l.slug AS league_slug,
  home.id AS home_team_season_id, home_team.id AS home_team_id, home_team.name AS home_team_name,
  home_team.slug AS home_team_slug, home_team.short_code AS home_team_short_code, home_team.logo_url AS home_team_logo_url,
  away.id AS away_team_season_id, away_team.id AS away_team_id, away_team.name AS away_team_name,
  away_team.slug AS away_team_slug, away_team.short_code AS away_team_short_code, away_team.logo_url AS away_team_logo_url,
  NULL::uuid AS revision_id,
  NULL::integer AS revision_number,
  NULL::timestamptz AS revision_approved_at,
  NULL::uuid AS source_submission_id,
  NULL::text AS source_type,
  NULL::text AS evidence_url,
  NULL::uuid AS source_reviewer_id,
  NULL::timestamptz AS source_reviewed_at,
  home_team.primary_color AS home_team_primary_color,
  away_team.primary_color AS away_team_primary_color,
  g.status IN ('live_provisional', 'final_pending_review') AS is_provisional
FROM public.games g
JOIN public.competitions c ON c.id = g.competition_id
JOIN public.seasons s ON s.id = c.season_id
JOIN public.leagues l ON l.id = s.league_id
LEFT JOIN public.venues v ON v.id = g.venue_id
JOIN public.team_seasons home ON home.id = g.home_team_season_id
JOIN public.teams home_team ON home_team.id = home.team_id
JOIN public.team_seasons away ON away.id = g.away_team_season_id
JOIN public.teams away_team ON away_team.id = away.team_id
WHERE g.status IN (
  'scheduled',
  'live_provisional',
  'final_pending_review',
  'cancelled',
  'postponed'
);

DROP VIEW IF EXISTS public.v_public_standings CASCADE;
CREATE VIEW public.v_public_standings
WITH (security_invoker = true) AS
SELECT
  st.competition_id, c.name AS competition_name,
  s.id AS season_id, s.name AS season_name,
  l.id AS league_id, l.slug AS league_slug,
  st.team_season_id, ts.team_id, t.name AS team_name, t.slug AS team_slug, t.logo_url AS team_logo_url,
  st.wins, st.losses, st.win_pct, st.gb, st.streak, st.last10, st.points_for, st.points_against,
  t.short_code AS team_short_code,
  t.primary_color AS team_primary_color
FROM public.standings st
JOIN public.competitions c ON c.id = st.competition_id
JOIN public.seasons s ON s.id = c.season_id
JOIN public.leagues l ON l.id = s.league_id
JOIN public.team_seasons ts ON ts.id = st.team_season_id
JOIN public.teams t ON t.id = ts.team_id
WHERE EXISTS (
  SELECT 1 FROM public.games g
  WHERE g.competition_id = st.competition_id AND g.status IN ('league_verified', 'official')
);

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
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.photo_url END AS player_photo_url
FROM public.season_player_stats sps
JOIN public.competitions c ON c.id = sps.competition_id
JOIN public.seasons s ON s.id = c.season_id
JOIN public.leagues l ON l.id = s.league_id
JOIN public.players p ON p.id = sps.player_id
JOIN public.team_seasons ts ON ts.id = sps.team_season_id
JOIN public.teams t ON t.id = ts.team_id
WHERE EXISTS (
  SELECT 1 FROM public.games g
  WHERE g.competition_id = sps.competition_id AND g.status IN ('league_verified', 'official')
);

DROP VIEW IF EXISTS public.v_public_team_roster CASCADE;
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
  ts.id AS team_season_id,
  ts.team_id,
  t.name AS team_name,
  t.slug AS team_slug,
  t.logo_url AS team_logo_url,
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
  CASE WHEN sps.fta > 0 THEN sps.ftm::double precision / sps.fta ELSE NULL END AS ftp_per_game,
  sps.oreb AS oreb_per_game,
  sps.dreb AS dreb_per_game,
  sps.ast AS ast_per_game,
  sps.stl AS stl_per_game,
  sps.blk AS blk_per_game,
  sps.tov AS tov_per_game,
  sps.pf AS pf_per_game,
  t.short_code AS team_short_code,
  t.primary_color AS team_primary_color
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

GRANT SELECT ON public.v_public_games, public.v_public_live_games,
  public.v_public_standings, public.v_public_leaders,
  public.v_public_team_roster, public.v_public_player_profiles
TO anon, authenticated;
