-- V2 Recovery: Fix corrupted remote schema.
-- The remote has v1 enum values and is missing 7 tables, all functions, RLS, and views.
-- This migration brings the remote to the correct v2 state.

-- 1. Fix game_status enum: add v2 values, remove v1 values
-- Step 1: Add new enum values first (so rows can reference them)
DO $$ BEGIN
  ALTER TYPE public.game_status ADD VALUE 'live_provisional' AFTER 'scheduled';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.game_status ADD VALUE 'final_pending_review' AFTER 'live_provisional';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.game_status ADD VALUE 'league_verified' AFTER 'final_pending_review';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Migrate any legacy rows to v2 enum values (safe no-ops if no v1 rows exist)
DO $$ BEGIN UPDATE public.games SET status = 'live_provisional' WHERE status = 'live';
EXCEPTION WHEN invalid_text_representation THEN NULL;
END $$;
DO $$ BEGIN UPDATE public.games SET status = 'final_pending_review' WHERE status = 'final';
EXCEPTION WHEN invalid_text_representation THEN NULL;
END $$;
DO $$ BEGIN UPDATE public.games SET status = 'league_verified' WHERE status = 'verified';
EXCEPTION WHEN invalid_text_representation THEN NULL;
END $$;


-- 2. Create missing tables
CREATE TABLE IF NOT EXISTS public.basketball_rulesets (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete restrict,
  version text not null,
  name text not null,
  rules jsonb not null,
  effective_from date not null,
  retired_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (league_id, version),
  check (retired_at is null or retired_at >= effective_from)
);

CREATE TABLE IF NOT EXISTS public.tracker_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  scorer_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('lead_scorer', 'backup_scorer')),
  device_info jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'transferred', 'closed', 'revoked')),
  last_acknowledged_sequence integer not null default 0 check (last_acknowledged_sequence >= 0),
  handed_off_to_session_id uuid references public.tracker_sessions(id) on delete set null,
  closure_reason text,
  started_at timestamptz not null default now(),
  closed_at timestamptz,
  check ((status = 'active') = (closed_at is null))
);
CREATE UNIQUE INDEX IF NOT EXISTS tracker_sessions_one_active_writer_idx
  ON public.tracker_sessions (game_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS tracker_sessions_scorer_idx ON public.tracker_sessions (scorer_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.source_submissions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete restrict,
  source_type text not null check (source_type in ('tracker_journal', 'official_score_sheet', 'manual_box_score', 'import')),
  evidence_url text,
  rights_confirmed_at timestamptz,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  normalized_payload jsonb not null,
  confidence numeric(3,2) check (confidence is null or confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'superseded')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  idempotency_key uuid,
  unique (submitted_by, idempotency_key),
  check ((status in ('approved', 'rejected')) = (reviewed_at is not null))
);
CREATE INDEX IF NOT EXISTS source_submissions_game_idx ON public.source_submissions (game_id, submitted_at desc);
CREATE INDEX IF NOT EXISTS source_submissions_pending_idx ON public.source_submissions (game_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.game_revisions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  source_submission_id uuid not null references public.source_submissions(id) on delete restrict,
  parent_revision_id uuid references public.game_revisions(id) on delete restrict,
  state text not null default 'pending' check (state in ('pending', 'approved', 'rejected', 'superseded')),
  journal jsonb not null,
  projection jsonb not null,
  validation_warnings jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  unique (game_id, revision_number),
  check ((state = 'approved') = (approved_at is not null))
);
CREATE INDEX IF NOT EXISTS game_revisions_game_idx ON public.game_revisions (game_id, revision_number desc);

CREATE TABLE IF NOT EXISTS public.correction_records (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  reason text not null,
  evidence_url text,
  proposed_change jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resulting_revision_id uuid references public.game_revisions(id) on delete set null,
  check ((status in ('approved', 'rejected', 'applied')) = (resolved_at is not null))
);
CREATE INDEX IF NOT EXISTS correction_records_game_idx ON public.correction_records (game_id, requested_at desc);
CREATE INDEX IF NOT EXISTS correction_records_pending_idx ON public.correction_records (game_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.player_aliases (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source_submission_id uuid references public.source_submissions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (normalized_alias)
);
CREATE INDEX IF NOT EXISTS player_aliases_player_idx ON public.player_aliases (player_id);

CREATE TABLE IF NOT EXISTS public.player_merge_history (
  id uuid primary key default gen_random_uuid(),
  kept_player_id uuid not null references public.players(id) on delete restrict,
  merged_player_id uuid not null references public.players(id) on delete restrict,
  merged_by uuid not null references auth.users(id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (merged_player_id),
  check (kept_player_id <> merged_player_id)
);

-- 3. Create private schema and functions
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.user_can_manage_game(p_game_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.competitions c ON c.id = g.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.memberships m ON (
      (m.scope_type = 'league' AND m.scope_id = s.league_id)
      OR (m.scope_type = 'org' AND m.scope_id = (SELECT l.organization_id FROM public.leagues l WHERE l.id = s.league_id))
    )
    WHERE g.id = p_game_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'manager')
  );
$$;

CREATE OR REPLACE FUNCTION private.user_can_score_game(p_game_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_assignments ga
    WHERE ga.game_id = p_game_id
      AND ga.user_id = (SELECT auth.uid())
      AND ga.role IN ('lead_scorer', 'backup_scorer')
  ) OR private.user_can_manage_game(p_game_id);
$$;

CREATE OR REPLACE FUNCTION private.user_can_approve_game(p_game_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_assignments ga
    WHERE ga.game_id = p_game_id
      AND ga.user_id = (SELECT auth.uid())
      AND ga.role = 'approving_official'
  ) OR private.user_can_manage_game(p_game_id);
$$;

CREATE OR REPLACE FUNCTION private.write_audit(
  p_action text, p_entity_type text, p_entity_id uuid, p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, payload)
  VALUES ((SELECT auth.uid()), p_action, p_entity_type, p_entity_id, p_payload);
END;
$$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role;

-- 4. Enable RLS on all tables
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basketball_rulesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stat_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_merge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (drop existing first to avoid conflicts)
DO $$ BEGIN
  -- Public read policies
  PERFORM 1 FROM pg_policies WHERE policyname = 'public_read_sports' AND tablename = 'sports';
  IF NOT FOUND THEN
    CREATE POLICY public_read_sports ON public.sports FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_organizations ON public.organizations FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_leagues ON public.leagues FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_seasons ON public.seasons FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_competitions ON public.competitions FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_venues ON public.venues FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_teams ON public.teams FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_team_seasons ON public.team_seasons FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_players ON public.players FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_roster_entries ON public.roster_entries FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_rulesets ON public.basketball_rulesets FOR SELECT TO anon, authenticated USING (retired_at IS NULL);
    CREATE POLICY public_read_games ON public.games FOR SELECT TO anon, authenticated USING (status IN ('league_verified', 'official'));
    CREATE POLICY public_read_game_rosters ON public.game_rosters FOR SELECT TO anon, authenticated USING (
      EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.status IN ('league_verified', 'official'))
    );
    CREATE POLICY public_read_event_types ON public.stat_event_types FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_game_player_stats ON public.game_player_stats FOR SELECT TO anon, authenticated USING (
      EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.status IN ('league_verified', 'official'))
    );
    CREATE POLICY public_read_game_team_stats ON public.game_team_stats FOR SELECT TO anon, authenticated USING (
      EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.status IN ('league_verified', 'official'))
    );
    CREATE POLICY public_read_season_player_stats ON public.season_player_stats FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_standings ON public.standings FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_player_aliases ON public.player_aliases FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY public_read_approved_sources ON public.source_submissions FOR SELECT TO anon, authenticated USING (
      status = 'approved' AND EXISTS (
        SELECT 1 FROM public.games g WHERE g.id = game_id AND g.status IN ('league_verified', 'official')
      )
    );
    CREATE POLICY public_read_approved_revisions ON public.game_revisions FOR SELECT TO anon, authenticated USING (
      state = 'approved' AND EXISTS (
        SELECT 1 FROM public.games g
        WHERE g.id = game_id AND g.status IN ('league_verified', 'official') AND g.current_revision_number = revision_number
      )
    );

    -- Operator policies
    CREATE POLICY operators_read_assignments ON public.game_assignments FOR SELECT TO authenticated USING (
      user_id = (SELECT auth.uid()) OR private.user_can_manage_game(game_id)
    );
    CREATE POLICY operators_read_events ON public.stat_events FOR SELECT TO authenticated USING (
      created_by = (SELECT auth.uid()) OR private.user_can_score_game(game_id) OR private.user_can_approve_game(game_id)
    );
    CREATE POLICY operators_read_sessions ON public.tracker_sessions FOR SELECT TO authenticated USING (
      scorer_id = (SELECT auth.uid()) OR private.user_can_score_game(game_id) OR private.user_can_approve_game(game_id)
    );
    CREATE POLICY operators_read_submissions ON public.source_submissions FOR SELECT TO authenticated USING (
      submitted_by = (SELECT auth.uid()) OR private.user_can_approve_game(game_id)
    );
    CREATE POLICY operators_read_revisions ON public.game_revisions FOR SELECT TO authenticated USING (
      created_by = (SELECT auth.uid()) OR private.user_can_approve_game(game_id)
    );
    CREATE POLICY operators_read_corrections ON public.correction_records FOR SELECT TO authenticated USING (
      requested_by = (SELECT auth.uid()) OR private.user_can_approve_game(game_id)
    );
    CREATE POLICY users_read_profile ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
    CREATE POLICY users_update_profile ON public.profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
    CREATE POLICY users_read_memberships ON public.memberships FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
    CREATE POLICY operators_read_merges ON public.player_merge_history FOR SELECT TO authenticated USING (true);
    CREATE POLICY operators_read_audit ON public.audit_log FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.games g WHERE g.id = audit_log.entity_id AND private.user_can_approve_game(g.id))
    );
  END IF;
END $$;

-- 6. Create public command functions
CREATE OR REPLACE FUNCTION public.cmd_record_event(
  p_game_id uuid, p_tracker_session_id uuid, p_operation_id uuid, p_client_id uuid,
  p_local_seq integer, p_event_type text, p_period smallint, p_clock_seconds smallint,
  p_team_season_id uuid, p_player_id uuid, p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS public.stat_events LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_event public.stat_events;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.user_can_score_game(p_game_id) THEN
    RAISE EXCEPTION 'not authorized to record events';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.tracker_sessions s WHERE s.id = p_tracker_session_id AND s.game_id = p_game_id
      AND s.scorer_id = (SELECT auth.uid()) AND s.status = 'active'
  ) THEN RAISE EXCEPTION 'active tracker session required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.games g WHERE g.id = p_game_id AND g.status = 'live_provisional') THEN
    RAISE EXCEPTION 'game is not live provisional';
  END IF;
  INSERT INTO public.stat_events (
    game_id, tracker_session_id, operation_id, client_id, local_seq, event_type, period,
    clock_seconds, team_season_id, player_id, payload, created_by
  ) VALUES (
    p_game_id, p_tracker_session_id, p_operation_id, p_client_id, p_local_seq, p_event_type,
    p_period, p_clock_seconds, p_team_season_id, p_player_id, COALESCE(p_payload, '{}'::jsonb), (SELECT auth.uid())
  ) ON CONFLICT (operation_id) DO NOTHING
  RETURNING * INTO v_event;
  IF v_event.id IS NULL THEN
    SELECT * INTO v_event FROM public.stat_events
    WHERE operation_id = p_operation_id AND game_id = p_game_id AND created_by = (SELECT auth.uid());
    IF NOT FOUND THEN RAISE EXCEPTION 'idempotency key belongs to another command'; END IF;
  END IF;
  UPDATE public.tracker_sessions SET last_acknowledged_sequence = GREATEST(last_acknowledged_sequence, p_local_seq)
    WHERE id = p_tracker_session_id;
  PERFORM private.write_audit('record_event', 'stat_event', v_event.id, jsonb_build_object('game_id', p_game_id));
  RETURN v_event;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_void_event(p_event_id uuid, p_reason text)
RETURNS public.stat_events LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_event public.stat_events;
BEGIN
  SELECT * INTO v_event FROM public.stat_events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND OR NOT private.user_can_score_game(v_event.game_id) THEN RAISE EXCEPTION 'not authorized to void event'; END IF;
  UPDATE public.stat_events SET voided_at = now(), voided_by = (SELECT auth.uid()), void_reason = NULLIF(TRIM(p_reason), '')
    WHERE id = p_event_id RETURNING * INTO v_event;
  PERFORM private.write_audit('void_event', 'stat_event', p_event_id, jsonb_build_object('reason', p_reason));
  RETURN v_event;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_transition_game(p_game_id uuid, p_to_status public.game_status)
RETURNS public.games LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_game public.games;
BEGIN
  SELECT * INTO v_game FROM public.games WHERE id = p_game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'game not found'; END IF;
  IF p_to_status = 'live_provisional' AND NOT private.user_can_score_game(p_game_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF p_to_status IN ('final_pending_review', 'league_verified', 'official', 'cancelled', 'postponed') AND NOT private.user_can_approve_game(p_game_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF NOT ((v_game.status = 'scheduled' AND p_to_status IN ('live_provisional', 'cancelled', 'postponed'))
       OR (v_game.status = 'live_provisional' AND p_to_status IN ('final_pending_review', 'cancelled'))
       OR (v_game.status = 'final_pending_review' AND p_to_status IN ('league_verified', 'live_provisional'))
       OR (v_game.status = 'league_verified' AND p_to_status IN ('official', 'final_pending_review'))
       OR v_game.status = p_to_status) THEN RAISE EXCEPTION 'invalid game status transition'; END IF;
  UPDATE public.games SET status = p_to_status, published_at = CASE WHEN p_to_status IN ('league_verified', 'official') THEN now() ELSE published_at END
    WHERE id = p_game_id RETURNING * INTO v_game;
  PERFORM private.write_audit('transition_game', 'game', p_game_id, jsonb_build_object('status', p_to_status));
  RETURN v_game;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_submit_source(
  p_game_id uuid, p_source_type text, p_evidence_url text, p_rights_confirmed boolean,
  p_normalized_payload jsonb, p_confidence numeric, p_idempotency_key uuid
) RETURNS public.source_submissions LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_submission public.source_submissions;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.user_can_score_game(p_game_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF p_source_type NOT IN ('tracker_journal', 'official_score_sheet', 'manual_box_score', 'import') THEN RAISE EXCEPTION 'invalid source type'; END IF;
  INSERT INTO public.source_submissions (game_id, source_type, evidence_url, rights_confirmed_at, submitted_by, normalized_payload, confidence, idempotency_key)
  VALUES (p_game_id, p_source_type, p_evidence_url, CASE WHEN p_rights_confirmed THEN now() END, (SELECT auth.uid()), p_normalized_payload, p_confidence, p_idempotency_key)
  ON CONFLICT (submitted_by, idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
  RETURNING * INTO v_submission;
  PERFORM private.write_audit('submit_source', 'source_submission', v_submission.id, jsonb_build_object('game_id', p_game_id));
  RETURN v_submission;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_approve_source(p_submission_id uuid, p_approved boolean, p_note text DEFAULT NULL)
RETURNS public.source_submissions LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_submission public.source_submissions;
BEGIN
  SELECT * INTO v_submission FROM public.source_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND OR NOT private.user_can_approve_game(v_submission.game_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.source_submissions SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    reviewed_by = (SELECT auth.uid()), reviewed_at = now(), review_note = p_note WHERE id = p_submission_id RETURNING * INTO v_submission;
  PERFORM private.write_audit('review_source', 'source_submission', p_submission_id, jsonb_build_object('approved', p_approved));
  RETURN v_submission;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_create_revision(p_submission_id uuid, p_journal jsonb, p_projection jsonb, p_validation_warnings jsonb DEFAULT '[]'::jsonb)
RETURNS public.game_revisions LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_submission public.source_submissions; v_revision public.game_revisions; v_number integer;
BEGIN
  SELECT * INTO v_submission FROM public.source_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND OR v_submission.status <> 'approved' OR NOT private.user_can_approve_game(v_submission.game_id) THEN RAISE EXCEPTION 'approved source and reviewer required'; END IF;
  SELECT COALESCE(MAX(revision_number), 0) + 1 INTO v_number FROM public.game_revisions WHERE game_id = v_submission.game_id;
  INSERT INTO public.game_revisions (game_id, revision_number, source_submission_id, journal, projection, validation_warnings, created_by)
  VALUES (v_submission.game_id, v_number, p_submission_id, p_journal, p_projection, COALESCE(p_validation_warnings, '[]'::jsonb), (SELECT auth.uid())) RETURNING * INTO v_revision;
  RETURN v_revision;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_approve_revision(p_revision_id uuid, p_approved boolean)
RETURNS public.game_revisions LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_revision public.game_revisions;
BEGIN
  SELECT * INTO v_revision FROM public.game_revisions WHERE id = p_revision_id FOR UPDATE;
  IF NOT FOUND OR NOT private.user_can_approve_game(v_revision.game_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.game_revisions SET state = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    approved_by = (SELECT auth.uid()), approved_at = now() WHERE id = p_revision_id RETURNING * INTO v_revision;
  IF p_approved THEN
    UPDATE public.game_revisions SET state = 'superseded' WHERE game_id = v_revision.game_id AND id <> p_revision_id AND state = 'approved';
    UPDATE public.games SET current_revision_number = v_revision.revision_number WHERE id = v_revision.game_id;
  END IF;
  PERFORM private.write_audit('review_revision', 'game_revision', p_revision_id, jsonb_build_object('approved', p_approved));
  RETURN v_revision;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_assign_scorer(p_game_id uuid, p_user_id uuid, p_role text)
RETURNS public.game_assignments LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_assignment public.game_assignments;
BEGIN
  IF NOT private.user_can_manage_game(p_game_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF p_role NOT IN ('lead_scorer', 'backup_scorer', 'approving_official') THEN RAISE EXCEPTION 'invalid assignment role'; END IF;
  INSERT INTO public.game_assignments (game_id, user_id, role, assigned_by) VALUES (p_game_id, p_user_id, p_role, (SELECT auth.uid()))
  ON CONFLICT (game_id, user_id, role) DO UPDATE SET assigned_by = EXCLUDED.assigned_by RETURNING * INTO v_assignment;
  PERFORM private.write_audit('assign_game_role', 'game_assignment', v_assignment.id, jsonb_build_object('game_id', p_game_id, 'role', p_role));
  RETURN v_assignment;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_handoff_session(p_session_id uuid, p_to_user_id uuid, p_reason text)
RETURNS public.tracker_sessions LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_from public.tracker_sessions; v_to public.tracker_sessions;
BEGIN
  SELECT * INTO v_from FROM public.tracker_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND OR v_from.scorer_id <> (SELECT auth.uid()) OR v_from.status <> 'active' THEN RAISE EXCEPTION 'active owned session required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.game_assignments WHERE game_id = v_from.game_id AND user_id = p_to_user_id AND role IN ('lead_scorer', 'backup_scorer')) THEN RAISE EXCEPTION 'recipient is not an assigned scorer'; END IF;
  UPDATE public.tracker_sessions
  SET status = 'transferred', closed_at = now(), closure_reason = NULLIF(TRIM(p_reason), '')
  WHERE id = p_session_id;
  INSERT INTO public.tracker_sessions (game_id, scorer_id, role, device_info, status, last_acknowledged_sequence)
  VALUES (v_from.game_id, p_to_user_id, v_from.role, '{}'::jsonb, 'active', v_from.last_acknowledged_sequence)
  RETURNING * INTO v_to;
  UPDATE public.tracker_sessions SET handed_off_to_session_id = v_to.id WHERE id = p_session_id;
  PERFORM private.write_audit('handoff_session', 'tracker_session', p_session_id, jsonb_build_object('to_session_id', v_to.id));
  RETURN v_to;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_open_tracker_session(p_game_id uuid, p_role text, p_device_info jsonb DEFAULT '{}'::jsonb)
RETURNS public.tracker_sessions LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_session public.tracker_sessions;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR p_role NOT IN ('lead_scorer', 'backup_scorer')
    OR NOT EXISTS (SELECT 1 FROM public.game_assignments WHERE game_id = p_game_id AND user_id = (SELECT auth.uid()) AND role = p_role)
  THEN RAISE EXCEPTION 'not authorized to open tracker session'; END IF;
  SELECT * INTO v_session FROM public.tracker_sessions
    WHERE game_id = p_game_id AND scorer_id = (SELECT auth.uid()) AND status = 'active';
  IF FOUND THEN RETURN v_session; END IF;
  INSERT INTO public.tracker_sessions (game_id, scorer_id, role, device_info)
  VALUES (p_game_id, (SELECT auth.uid()), p_role, COALESCE(p_device_info, '{}'::jsonb))
  RETURNING * INTO v_session;
  PERFORM private.write_audit('open_session', 'tracker_session', v_session.id, jsonb_build_object('game_id', p_game_id));
  RETURN v_session;
END;
$$;

-- 7. Revoke and grant function permissions
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_record_event(uuid, uuid, uuid, uuid, integer, text, smallint, smallint, uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_void_event(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_transition_game(uuid, public.game_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_submit_source(uuid, text, text, boolean, jsonb, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_approve_source(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_create_revision(uuid, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_approve_revision(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_assign_scorer(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_handoff_session(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_open_tracker_session(uuid, text, jsonb) TO authenticated;

-- 8. Create publication views
CREATE OR REPLACE VIEW public.v_public_games
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
  ss.reviewed_by AS source_reviewer_id, ss.reviewed_at AS source_reviewed_at
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

CREATE OR REPLACE VIEW public.v_public_box_score
WITH (security_invoker = true) AS
SELECT
  gps.game_id, gps.revision_id, gr.revision_number, gr.approved_at AS revision_approved_at,
  gps.player_id, p.canonical_name AS player_name, p.name_latin AS player_name_latin, p.position AS player_position,
  gps.team_season_id, ts.team_id, t.name AS team_name, re.jersey_number,
  gps.seconds_played,
  gps.pts, gps.fgm, gps.fga, gps.tpm, gps.tpa, gps.ftm, gps.fta,
  gps.oreb, gps.dreb, gps.ast, gps.stl, gps.blk, gps.tov, gps.pf,
  ss.source_type, ss.evidence_url, ss.reviewed_at AS source_reviewed_at
FROM public.game_player_stats gps
JOIN public.games g ON g.id = gps.game_id AND g.status IN ('league_verified', 'official')
JOIN public.game_revisions gr ON gr.id = gps.revision_id AND gr.state = 'approved'
JOIN public.source_submissions ss ON ss.id = gr.source_submission_id AND ss.status = 'approved'
JOIN public.players p ON p.id = gps.player_id
JOIN public.team_seasons ts ON ts.id = gps.team_season_id
JOIN public.teams t ON t.id = ts.team_id
LEFT JOIN public.roster_entries re ON re.team_season_id = gps.team_season_id AND re.player_id = gps.player_id;

CREATE OR REPLACE VIEW public.v_public_standings
WITH (security_invoker = true) AS
SELECT
  st.competition_id, c.name AS competition_name,
  s.id AS season_id, s.name AS season_name,
  l.id AS league_id, l.slug AS league_slug,
  st.team_season_id, ts.team_id, t.name AS team_name, t.slug AS team_slug, t.logo_url AS team_logo_url,
  st.wins, st.losses, st.win_pct, st.gb, st.streak, st.last10, st.points_for, st.points_against
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

CREATE OR REPLACE VIEW public.v_public_leaders
WITH (security_invoker = true) AS
SELECT
  sps.competition_id, c.name AS competition_name,
  s.id AS season_id, l.id AS league_id,
  sps.player_id, p.canonical_name AS player_name, p.name_latin AS player_name_latin, p.position AS player_position,
  sps.team_season_id, ts.team_id, t.name AS team_name,
  sps.gp, sps.mpg, sps.pts,
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

CREATE OR REPLACE VIEW public.v_public_team_roster
WITH (security_invoker = true) AS
SELECT
  ts.id AS team_season_id, ts.competition_id, ts.team_id,
  t.name AS team_name, t.slug AS team_slug,
  re.id AS roster_entry_id, re.jersey_number, re.position AS roster_position,
  p.id AS player_id, p.canonical_name AS player_name, p.name_latin AS player_name_latin,
  p.position AS player_position, p.photo_url
FROM public.team_seasons ts
JOIN public.teams t ON t.id = ts.team_id
JOIN public.roster_entries re ON re.team_season_id = ts.id AND re.left_at IS NULL
JOIN public.players p ON p.id = re.player_id;

-- 9. Grant view access
GRANT SELECT ON public.v_public_games, public.v_public_box_score, public.v_public_standings,
  public.v_public_leaders, public.v_public_team_roster TO anon, authenticated;

-- 10. Seed basketball ruleset for existing league
INSERT INTO public.basketball_rulesets (id, league_id, version, name, rules, effective_from)
SELECT '90000000-0000-0000-0000-000000000001', l.id, '2026-pilot.1', 'Onoo Pilot 5x5',
  '{"periods":4,"period_minutes":10,"overtime_minutes":5,"personal_foul_limit":5,"players_on_court":5}'::jsonb,
  '2026-09-01'
FROM public.leagues l
WHERE NOT EXISTS (SELECT 1 FROM public.basketball_rulesets WHERE league_id = l.id)
ON CONFLICT DO NOTHING;
