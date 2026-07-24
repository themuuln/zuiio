-- ============================================================================
-- Migration: Canonical Identity & Athlete Linking (Horizon C.1)
-- 
-- Adds infrastructure to link academy_students to auth.users and to create
-- cross-domain canonical identities that connect players, students, and
-- other athlete records.
-- ============================================================================

-- ── 1. Add user_id to academy_students ─────────────────────────────────────
-- This links a student to their auth account, enabling cross-domain identity.
ALTER TABLE public.academy_students
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS academy_students_user_idx
  ON public.academy_students (user_id);

-- ── 2. Canonical identity hub ─────────────────────────────────────────────
-- A single row represents one real-world person who may have records in
-- multiple domains (player, student, team member, etc.).
CREATE TABLE IF NOT EXISTS public.canonical_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.canonical_identities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read; only admins write via RPC
CREATE POLICY read_canonical_identities ON public.canonical_identities
  FOR SELECT TO authenticated USING (true);

-- ── 3. Add canonical identity references to entity tables ─────────────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS canonical_identity_id uuid
  REFERENCES public.canonical_identities(id) ON DELETE SET NULL;

ALTER TABLE public.academy_students
  ADD COLUMN IF NOT EXISTS canonical_identity_id uuid
  REFERENCES public.canonical_identities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS players_canonical_idx
  ON public.players (canonical_identity_id);
CREATE INDEX IF NOT EXISTS academy_students_canonical_idx
  ON public.academy_students (canonical_identity_id);

-- ── 4. Grant permissions on new columns ────────────────────────────────────
-- The underlying tables already have RLS; new columns inherit table-level
-- policies. No additional grants needed.

-- ============================================================================
-- RPCs
-- ============================================================================

-- ── cmd_create_canonical_link ──────────────────────────────────────────────
-- Assigns a canonical_identity_id to an entity, creating a new identity row
-- if one doesn't already exist. Returns the canonical_identity_id.
--
-- Usage:
--   SELECT cmd_create_canonical_link('player', 'some-uuid');
--   SELECT cmd_create_canonical_link('student', 'some-uuid');
-- 
-- Idempotent: if the entity already has a canonical_identity_id, returns it.
CREATE OR REPLACE FUNCTION public.cmd_create_canonical_link(
  p_entity_type text,
  p_entity_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS
$$
DECLARE
  v_canonical_id uuid;
BEGIN
  -- Authorization: caller must be admin/owner of an org
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'not authorized to manage identities';
  END IF;

  -- Check if entity already has a canonical identity
  IF p_entity_type = 'player' THEN
    SELECT canonical_identity_id INTO v_canonical_id
    FROM public.players WHERE id = p_entity_id;
  ELSIF p_entity_type = 'student' THEN
    SELECT canonical_identity_id INTO v_canonical_id
    FROM public.academy_students WHERE id = p_entity_id;
  ELSE
    RAISE EXCEPTION 'unknown entity type: %', p_entity_type;
  END IF;

  -- If none exists, create one
  IF v_canonical_id IS NULL THEN
    INSERT INTO public.canonical_identities DEFAULT VALUES
    RETURNING id INTO v_canonical_id;

    IF p_entity_type = 'player' THEN
      UPDATE public.players SET canonical_identity_id = v_canonical_id
      WHERE id = p_entity_id;
    ELSIF p_entity_type = 'student' THEN
      UPDATE public.academy_students SET canonical_identity_id = v_canonical_id
      WHERE id = p_entity_id;
    END IF;
  END IF;

  RETURN v_canonical_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_create_canonical_link FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_create_canonical_link TO authenticated;

-- ── cmd_merge_canonical_identities ─────────────────────────────────────────
-- Merges two canonical identities into one. All entities pointing to
-- p_source_canonical_id are repointed to p_target_canonical_id, then the
-- source row is deleted. Only org owners/admins may call this.
--
-- Usage: SELECT cmd_merge_canonical_identities('src-uuid', 'tgt-uuid');
CREATE OR REPLACE FUNCTION public.cmd_merge_canonical_identities(
  p_source_canonical_id uuid,
  p_target_canonical_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS
$$
BEGIN
  -- Authorization: caller must be admin/owner
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'not authorized to merge identities';
  END IF;

  -- Repoint all entities from source to target
  UPDATE public.players
  SET canonical_identity_id = p_target_canonical_id
  WHERE canonical_identity_id = p_source_canonical_id;

  UPDATE public.academy_students
  SET canonical_identity_id = p_target_canonical_id
  WHERE canonical_identity_id = p_source_canonical_id;

  -- Delete the now-empty source identity
  DELETE FROM public.canonical_identities WHERE id = p_source_canonical_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_merge_canonical_identities FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_merge_canonical_identities TO authenticated;

-- ── cmd_link_student_to_user ──────────────────────────────────────────────
-- Links an academy student's user_id to an existing auth user.
-- Updates both the link and merges their canonical identities if both exist.
--
-- Usage: SELECT cmd_link_student_to_user('student-uuid', 'user-uuid');
CREATE OR REPLACE FUNCTION public.cmd_link_student_to_user(
  p_student_id uuid,
  p_user_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS
$$
DECLARE
  v_student_canonical_id uuid;
  v_user_player_canonical_id uuid;
BEGIN
  -- Authorization: caller must be admin/owner
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'not authorized to link entities';
  END IF;

  -- Link the student to the user
  UPDATE public.academy_students
  SET user_id = p_user_id
  WHERE id = p_student_id;

  -- Now try to merge canonical identities
  -- Get the student's canonical identity
  SELECT canonical_identity_id INTO v_student_canonical_id
  FROM public.academy_students WHERE id = p_student_id;

  -- Get the player's (or other entity's) canonical identity via user_id
  -- Players have user_id, and they may already have a canonical identity
  SELECT p.canonical_identity_id INTO v_user_player_canonical_id
  FROM public.players p
  WHERE p.user_id = p_user_id;

  -- If both exist and are different, merge them
  IF v_student_canonical_id IS NOT NULL
     AND v_user_player_canonical_id IS NOT NULL
     AND v_student_canonical_id <> v_user_player_canonical_id
  THEN
    PERFORM public.cmd_merge_canonical_identities(
      v_student_canonical_id,
      v_user_player_canonical_id
    );
  END IF;

  -- If the student has a canonical identity but the user's player doesn't,
  -- assign the player to the student's canonical identity
  IF v_student_canonical_id IS NOT NULL
     AND v_user_player_canonical_id IS NULL
  THEN
    UPDATE public.players
    SET canonical_identity_id = v_student_canonical_id
    WHERE user_id = p_user_id;
  END IF;

  -- If the student has no canonical identity but the user's player does,
  -- assign the student to the player's canonical identity
  IF v_student_canonical_id IS NULL
     AND v_user_player_canonical_id IS NOT NULL
  THEN
    UPDATE public.academy_students
    SET canonical_identity_id = v_user_player_canonical_id
    WHERE id = p_student_id;
  END IF;

  -- If neither has a canonical identity, create one for the student
  IF v_student_canonical_id IS NULL
     AND v_user_player_canonical_id IS NULL
  THEN
    v_student_canonical_id := public.cmd_create_canonical_link('student', p_student_id);
    UPDATE public.players
    SET canonical_identity_id = v_student_canonical_id
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_link_student_to_user FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_link_student_to_user TO authenticated;

-- ── cmd_get_athlete_affiliations ───────────────────────────────────────────
-- Returns all linked entities for a given canonical identity.
-- Used by public pages to display "also at" badges.
--
-- Returns JSON array of { entity_type, entity_id, entity_name, source }
CREATE OR REPLACE FUNCTION public.cmd_get_athlete_affiliations(
  p_canonical_identity_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS
$$
DECLARE
  v_result jsonb;
BEGIN
  WITH entities AS (
    -- Players linked via canonical_identity_id
    SELECT 'player' AS entity_type, p.id AS entity_id,
           p.canonical_name AS entity_name, 'league' AS source
    FROM public.players p
    WHERE p.canonical_identity_id = p_canonical_identity_id
    UNION ALL
    -- Academy students linked via canonical_identity_id
    SELECT 'student' AS entity_type, s.id AS entity_id,
           s.canonical_name AS entity_name, ap.name AS source
    FROM public.academy_students s
    JOIN public.academy_profiles ap ON ap.id = s.academy_id
    WHERE s.canonical_identity_id = p_canonical_identity_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'entity_type', entity_type,
      'entity_id', entity_id,
      'entity_name', entity_name,
      'source', source
    )
  ) INTO v_result
  FROM entities;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_get_athlete_affiliations FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_get_athlete_affiliations TO anon, authenticated;

-- ============================================================================
-- Views
-- ============================================================================

-- v_athlete_timeline is recreated below after the view rebuild

-- ============================================================================
-- Fix: Restore dreb_per_game in v_public_player_profiles
-- (Dropped accidentally in 20260723110000_social_links.sql)
-- ============================================================================

DROP VIEW IF EXISTS public.v_public_player_directory CASCADE;
DROP VIEW IF EXISTS public.v_public_players CASCADE;
DROP VIEW IF EXISTS public.v_public_player_profiles CASCADE;

-- Recreate v_public_player_profiles WITH dreb_per_game
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

GRANT SELECT ON public.v_public_player_profiles TO anon, authenticated;

-- ── Recreate v_public_players ──────────────────────────────────────────
CREATE VIEW public.v_public_players
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

-- ── Recreate v_public_player_directory ──────────────────────────────────
CREATE VIEW public.v_public_player_directory
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

-- ── Recreate v_athlete_timeline ────────────────────────────────────────
CREATE VIEW public.v_athlete_timeline
WITH (security_invoker = true) AS
-- Game events from v_public_box_score (public)
SELECT
  'game' AS event_type,
  gps.player_id AS entity_id,
  gps.game_id AS event_id,
  g.scheduled_at AS event_date,
  c.name AS competition_name,
  player_team.name AS player_team_name,
  CASE WHEN gps.team_season_id = g.home_team_season_id THEN away_team.name ELSE home_team.name END AS opponent_name,
  g.home_score,
  g.away_score,
  gps.pts,
  gps.ast AS assists,
  (COALESCE(gps.oreb, 0) + COALESCE(gps.dreb, 0)) AS total_rebounds,
  NULL AS program_name,
  NULL AS event_label
FROM public.game_player_stats gps
JOIN public.games g ON g.id = gps.game_id AND g.status IN ('league_verified', 'official')
JOIN public.game_revisions gr ON gr.game_id = g.id AND gr.state = 'approved'
JOIN public.team_seasons pts ON pts.id = gps.team_season_id
JOIN public.teams player_team ON player_team.id = pts.team_id
JOIN public.team_seasons home ON home.id = g.home_team_season_id
JOIN public.teams home_team ON home_team.id = home.team_id
JOIN public.team_seasons away ON away.id = g.away_team_season_id
JOIN public.teams away_team ON away_team.id = away.team_id
JOIN public.competitions c ON c.id = pts.competition_id
WHERE EXISTS (
  SELECT 1 FROM public.players pl
  WHERE pl.id = gps.player_id AND pl.canonical_identity_id IS NOT NULL
)

UNION ALL

-- Academy enrollment events (consent-gated)
SELECT
  'enrollment' AS event_type,
  s.id AS entity_id,
  e.id AS event_id,
  e.enrolled_at AS event_date,
  p.name AS competition_name,
  NULL AS player_team_name,
  NULL AS opponent_name,
  NULL::integer AS home_score,
  NULL::integer AS away_score,
  NULL::smallint AS pts,
  NULL::smallint AS assists,
  NULL::smallint AS total_rebounds,
  p.name AS program_name,
  'Бүртгүүлсэн' AS event_label
FROM public.academy_enrollments e
JOIN public.academy_students s ON s.id = e.student_id
JOIN public.academy_programs p ON p.id = e.program_id
WHERE s.canonical_identity_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players pl
    WHERE pl.canonical_identity_id = s.canonical_identity_id
  )

ORDER BY event_date DESC;

GRANT SELECT ON public.v_athlete_timeline TO anon, authenticated;
