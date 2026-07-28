-- FIBA official stats complete schema expansion
-- ============================================================================
-- Adds columns to existing tables, creates new derived tables with RLS,
-- adds new columns to season_player_stats, and updates/recreates public views
-- to expose FIBA box-score fields: plus_minus, fouls stats, team flow stats,
-- period scores, scoring checkpoints, game summary, is_starter/dnp_reason.
-- ============================================================================

-- ── 1. Add columns to game_player_stats ─────────────────────────────────────
ALTER TABLE public.game_player_stats
  ADD COLUMN IF NOT EXISTS plus_minus smallint,
  ADD COLUMN IF NOT EXISTS fouls_committed smallint,
  ADD COLUMN IF NOT EXISTS fouls_drawn smallint;

COMMENT ON COLUMN public.game_player_stats.plus_minus IS 'Player +/- when on court (FIBA box score)';
COMMENT ON COLUMN public.game_player_stats.fouls_committed IS 'Personal fouls committed (FIBA column C)';
COMMENT ON COLUMN public.game_player_stats.fouls_drawn IS 'Personal fouls drawn (FIBA column D)';

-- ── 2. Add columns to season_player_stats (per-game averages) ──────────────
ALTER TABLE public.season_player_stats
  ADD COLUMN IF NOT EXISTS plus_minus real,
  ADD COLUMN IF NOT EXISTS fouls_committed real,
  ADD COLUMN IF NOT EXISTS fouls_drawn real;

COMMENT ON COLUMN public.season_player_stats.plus_minus IS 'Per-game average +/-';
COMMENT ON COLUMN public.season_player_stats.fouls_committed IS 'Per-game average fouls committed (C)';
COMMENT ON COLUMN public.season_player_stats.fouls_drawn IS 'Per-game average fouls drawn (D)';

-- ── 3. Add columns to game_team_stats ──────────────────────────────────────
ALTER TABLE public.game_team_stats
  ADD COLUMN IF NOT EXISTS fouls_committed smallint,
  ADD COLUMN IF NOT EXISTS fouls_drawn smallint,
  ADD COLUMN IF NOT EXISTS points_from_turnovers smallint,
  ADD COLUMN IF NOT EXISTS points_in_paint smallint,
  ADD COLUMN IF NOT EXISTS second_chance_points smallint,
  ADD COLUMN IF NOT EXISTS fast_break_points smallint,
  ADD COLUMN IF NOT EXISTS bench_points smallint,
  ADD COLUMN IF NOT EXISTS biggest_lead smallint,
  ADD COLUMN IF NOT EXISTS biggest_scoring_run_for smallint,
  ADD COLUMN IF NOT EXISTS biggest_scoring_run_against smallint,
  ADD COLUMN IF NOT EXISTS time_leading_seconds integer;

COMMENT ON COLUMN public.game_team_stats.fouls_committed IS 'Team personal fouls committed';
COMMENT ON COLUMN public.game_team_stats.fouls_drawn IS 'Team personal fouls drawn';
COMMENT ON COLUMN public.game_team_stats.points_from_turnovers IS 'Points off turnovers';
COMMENT ON COLUMN public.game_team_stats.points_in_paint IS 'Points in the paint';
COMMENT ON COLUMN public.game_team_stats.second_chance_points IS 'Second chance points';
COMMENT ON COLUMN public.game_team_stats.fast_break_points IS 'Fast break points';
COMMENT ON COLUMN public.game_team_stats.bench_points IS 'Bench points';
COMMENT ON COLUMN public.game_team_stats.biggest_lead IS 'Biggest lead';
COMMENT ON COLUMN public.game_team_stats.biggest_scoring_run_for IS 'Biggest scoring run for';
COMMENT ON COLUMN public.game_team_stats.biggest_scoring_run_against IS 'Biggest scoring run against';
COMMENT ON COLUMN public.game_team_stats.time_leading_seconds IS 'Total time leading in seconds';

-- ── 4. New table: game_summary_stats ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_summary_stats (
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  revision_id uuid NOT NULL REFERENCES public.game_revisions(id) ON DELETE CASCADE,
  lead_changes smallint,
  times_tied smallint,
  PRIMARY KEY (game_id)
);

COMMENT ON TABLE public.game_summary_stats IS 'Game-level summary stats (lead changes, times tied) from FIBA box score';

-- ── 5. New table: game_period_scores ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_period_scores (
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  revision_id uuid NOT NULL REFERENCES public.game_revisions(id) ON DELETE CASCADE,
  period smallint NOT NULL CHECK (period > 0),
  home_points smallint NOT NULL CHECK (home_points >= 0),
  away_points smallint NOT NULL CHECK (away_points >= 0),
  PRIMARY KEY (game_id, period)
);

COMMENT ON TABLE public.game_period_scores IS 'Per-period scores from FIBA box score';

-- ── 6. New table: game_scoring_checkpoints ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_scoring_checkpoints (
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  revision_id uuid NOT NULL REFERENCES public.game_revisions(id) ON DELETE CASCADE,
  elapsed_seconds integer NOT NULL CHECK (elapsed_seconds > 0),
  home_score smallint NOT NULL CHECK (home_score >= 0),
  away_score smallint NOT NULL CHECK (away_score >= 0),
  PRIMARY KEY (game_id, elapsed_seconds)
);

COMMENT ON TABLE public.game_scoring_checkpoints IS 'Cumulative scoring checkpoints from FIBA box score (e.g. 5-min intervals)';

-- ── 7. RLS policies for new tables ─────────────────────────────────────────
ALTER TABLE public.game_summary_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_period_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scoring_checkpoints ENABLE ROW LEVEL SECURITY;

-- Same pattern as existing public_read_game_player_stats
CREATE POLICY public_read_game_summary_stats ON public.game_summary_stats
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.status IN ('league_verified', 'official'))
  );

CREATE POLICY public_read_game_period_scores ON public.game_period_scores
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.status IN ('league_verified', 'official'))
  );

CREATE POLICY public_read_game_scoring_checkpoints ON public.game_scoring_checkpoints
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.status IN ('league_verified', 'official'))
  );

-- No INSERT/UPDATE/DELETE policies on new tables (admin access via RPC only)

-- ── 8. Update v_public_box_score ──────────────────────────────────────────
-- Depends on game_player_stats, game_rosters, players, team_seasons, etc.

DROP VIEW IF EXISTS public.v_public_leaders CASCADE;
DROP VIEW IF EXISTS public.v_public_team_roster CASCADE;
DROP VIEW IF EXISTS public.v_public_box_score CASCADE;
DROP VIEW IF EXISTS public.v_public_standings CASCADE;
DROP VIEW IF EXISTS public.v_public_live_games CASCADE;
DROP VIEW IF EXISTS public.v_public_games CASCADE;
DROP VIEW IF EXISTS public.v_public_player_profiles CASCADE;

CREATE VIEW public.v_public_box_score
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
  gps.plus_minus,
  gps.fouls_committed,
  gps.fouls_drawn,
  gRoster.is_starter,
  gRoster.dnp_reason,
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
LEFT JOIN public.roster_entries re ON re.team_season_id = gps.team_season_id AND re.player_id = gps.player_id
LEFT JOIN public.game_rosters gRoster
  ON gRoster.game_id = gps.game_id
  AND gRoster.team_season_id = gps.team_season_id
  AND gRoster.player_id = gps.player_id;

-- ── 9. Update v_public_leaders ────────────────────────────────────────────
-- Add new season_player_stats columns and efficiency metric

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
  sps.plus_minus AS avg_plus_minus,
  sps.fouls_committed AS avg_fouls_committed,
  sps.fouls_drawn AS avg_fouls_drawn,
  (sps.fgm * 2 + sps.tpm * 3 + sps.ftm) AS eff,
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

-- ── 10. Recreate v_public_team_roster (dropped by CASCADE above) ──────────

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

-- ── 11. Recreate v_public_player_profiles ─────────────────────────────────

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
  sps.pf AS pf_per_game,
  sps.plus_minus AS plus_minus_per_game,
  sps.fouls_committed AS fouls_committed_per_game,
  sps.fouls_drawn AS fouls_drawn_per_game
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

-- ── 12. Recreate v_public_games (dropped by CASCADE above) ─────────────────

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

-- ── 13. Recreate v_public_live_games ──────────────────────────────────────

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

-- ── 14. Recreate v_public_standings ───────────────────────────────────────

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

-- ── 15. Update v_public_team_game_stats ───────────────────────────────────
-- Add new team flow fields for both team and opponent side

DROP VIEW IF EXISTS public.v_public_team_game_stats CASCADE;

CREATE VIEW public.v_public_team_game_stats
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
  t.fouls_committed AS team_fouls_committed,
  t.fouls_drawn AS team_fouls_drawn,
  t.points_from_turnovers AS team_points_from_turnovers,
  t.points_in_paint AS team_points_in_paint,
  t.second_chance_points AS team_second_chance_points,
  t.fast_break_points AS team_fast_break_points,
  t.bench_points AS team_bench_points,
  t.biggest_lead AS team_biggest_lead,
  t.biggest_scoring_run_for AS team_biggest_scoring_run_for,
  t.biggest_scoring_run_against AS team_biggest_scoring_run_against,
  t.time_leading_seconds AS team_time_leading_seconds,

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
  o.fouls_committed AS opp_fouls_committed,
  o.fouls_drawn AS opp_fouls_drawn,
  o.points_from_turnovers AS opp_points_from_turnovers,
  o.points_in_paint AS opp_points_in_paint,
  o.second_chance_points AS opp_second_chance_points,
  o.fast_break_points AS opp_fast_break_points,
  o.bench_points AS opp_bench_points,
  o.biggest_lead AS opp_biggest_lead,
  o.biggest_scoring_run_for AS opp_biggest_scoring_run_for,
  o.biggest_scoring_run_against AS opp_biggest_scoring_run_against,
  o.time_leading_seconds AS opp_time_leading_seconds,

  -- Home/away designation
  CASE WHEN t.team_season_id = g.home_team_season_id THEN 'home' ELSE 'away' END AS home_away,

  -- Opponent team info
  o.team_season_id AS opp_team_season_id,
  opp_team.name AS opp_team_name,
  opp_team.slug AS opp_team_slug,
  opp_team.short_code AS opp_team_short_code,
  opp_team.logo_url AS opp_team_logo_url

FROM public.games g
JOIN public.game_team_stats t ON t.game_id = g.id
JOIN public.game_team_stats o ON o.game_id = g.id AND o.team_season_id != t.team_season_id
JOIN public.team_seasons opp_ts ON opp_ts.id = o.team_season_id
JOIN public.teams opp_team ON opp_team.id = opp_ts.team_id
WHERE g.status IN ('league_verified', 'official');

-- ── 16. New view: v_public_game_summary ────────────────────────────────────

CREATE VIEW public.v_public_game_summary
WITH (security_invoker = true) AS
SELECT
  game_id,
  lead_changes,
  times_tied
FROM public.game_summary_stats;

-- ── 17. New view: v_public_game_period_scores ──────────────────────────────

CREATE VIEW public.v_public_game_period_scores
WITH (security_invoker = true) AS
SELECT
  game_id,
  period,
  home_points,
  away_points
FROM public.game_period_scores;

-- ── 18. New view: v_public_game_scoring_checkpoints ────────────────────────

CREATE VIEW public.v_public_game_scoring_checkpoints
WITH (security_invoker = true) AS
SELECT
  game_id,
  elapsed_seconds,
  home_score,
  away_score
FROM public.game_scoring_checkpoints;

-- ── 19. Grant SELECT permissions on all public views ──────────────────────

GRANT SELECT ON public.v_public_games, public.v_public_live_games,
  public.v_public_standings, public.v_public_leaders,
  public.v_public_team_roster, public.v_public_player_profiles,
  public.v_public_team_game_stats,
  public.v_public_game_summary, public.v_public_game_period_scores,
  public.v_public_game_scoring_checkpoints
TO anon, authenticated;
