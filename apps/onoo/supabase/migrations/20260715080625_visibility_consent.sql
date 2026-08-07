-- Task 2.2: Player visibility and consent tracking

-- 1. Add columns to players table
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'hidden')),
  ADD COLUMN IF NOT EXISTS consent_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_note text;

-- 2. Update v_public_box_score — mask hidden player identity
CREATE OR REPLACE VIEW public.v_public_box_score
WITH (security_invoker = true) AS
SELECT
  gps.game_id,
  gps.revision_id,
  gr.revision_number,
  gr.approved_at AS revision_approved_at,
  gps.player_id,
  CASE WHEN p.visibility = 'hidden' THEN 'Нэргүй тоглогч' ELSE p.canonical_name END AS player_name,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.name_latin END AS player_name_latin,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.position END AS player_position,
  gps.team_season_id,
  ts.team_id,
  t.name AS team_name,
  re.jersey_number,
  gps.seconds_played,
  gps.pts, gps.fgm, gps.fga, gps.tpm, gps.tpa, gps.ftm, gps.fta,
  gps.oreb, gps.dreb, gps.ast, gps.stl, gps.blk, gps.tov, gps.pf,
  ss.source_type,
  ss.evidence_url,
  ss.reviewed_at AS source_reviewed_at
FROM public.game_player_stats gps
JOIN public.games g ON g.id = gps.game_id AND g.status IN ('league_verified', 'official')
JOIN public.game_revisions gr ON gr.id = gps.revision_id AND gr.state = 'approved'
JOIN public.source_submissions ss ON ss.id = gr.source_submission_id AND ss.status = 'approved'
JOIN public.players p ON p.id = gps.player_id
JOIN public.team_seasons ts ON ts.id = gps.team_season_id
JOIN public.teams t ON t.id = ts.team_id
LEFT JOIN public.roster_entries re ON re.team_season_id = gps.team_season_id AND re.player_id = gps.player_id;

-- 3. Update v_public_leaders — mask hidden player identity
CREATE OR REPLACE VIEW public.v_public_leaders
WITH (security_invoker = true) AS
SELECT
  sps.competition_id,
  c.name AS competition_name,
  s.id AS season_id,
  l.id AS league_id,
  sps.player_id,
  CASE WHEN p.visibility = 'hidden' THEN 'Нэргүй тоглогч' ELSE p.canonical_name END AS player_name,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.name_latin END AS player_name_latin,
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.position END AS player_position,
  sps.team_season_id,
  ts.team_id,
  t.name AS team_name,
  sps.gp,
  sps.mpg,
  sps.pts,
  sps.fgm, sps.fga, sps.tpm, sps.tpa, sps.ftm, sps.fta,
  sps.oreb, sps.dreb, sps.ast, sps.stl, sps.blk, sps.tov, sps.pf
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

-- 4. Update v_public_team_roster — mask hidden player identity
CREATE OR REPLACE VIEW public.v_public_team_roster
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
  CASE WHEN p.visibility = 'hidden' THEN NULL ELSE p.photo_url END AS photo_url
FROM public.team_seasons ts
JOIN public.teams t ON t.id = ts.team_id
JOIN public.roster_entries re ON re.team_season_id = ts.id AND re.left_at IS NULL
JOIN public.players p ON p.id = re.player_id;

-- 5. Update v_public_player_profiles — mask hidden player identity
CREATE OR REPLACE VIEW public.v_public_player_profiles
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
  sps.ftp AS ftp_per_game,
  sps.oreb AS oreb_per_game,
  sps.dreb AS dreb_per_game,
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
