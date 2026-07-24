-- ============================================================================
-- Identity disputes for Phase 8 T-8.2
-- Disputes let players (or their guardians) challenge identity/eligibility
-- decisions. Admins review, collect evidence, and resolve.
-- ============================================================================

-- ── Identity disputes ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_reason AS ENUM (
    'wrong_player', 'wrong_team', 'wrong_position', 'wrong_jersey',
    'eligibility_error', 'duplicate_record', 'stat_error', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.identity_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  dispute_reason public.dispute_reason NOT NULL,
  description text NOT NULL CHECK (char_length(description) >= 10),
  evidence_notes text,
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution_notes text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS identity_disputes_player_idx ON public.identity_disputes (player_id);
CREATE INDEX IF NOT EXISTS identity_disputes_status_idx ON public.identity_disputes (status);

ALTER TABLE public.identity_disputes ENABLE ROW LEVEL SECURITY;

-- RLS: org admins can read/write disputes in their org's competitions
-- Path: competition → season → league → organization
DROP POLICY IF EXISTS read_identity_disputes ON public.identity_disputes;
CREATE POLICY read_identity_disputes ON public.identity_disputes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.competitions c ON c.id = competition_id
      JOIN public.seasons s ON s.id = c.season_id
      JOIN public.leagues l ON l.id = s.league_id
      WHERE m.scope_type = 'org'
        AND m.scope_id = l.organization_id
        AND m.user_id = (SELECT auth.uid())
        AND m.role IN ('owner', 'admin', 'coordinator')
    )
    OR submitted_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS write_identity_disputes ON public.identity_disputes;
CREATE POLICY write_identity_disputes ON public.identity_disputes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.scope_type = 'org'
        AND m.user_id = (SELECT auth.uid())
        AND m.role IN ('owner', 'admin', 'coordinator')
    )
    OR submitted_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS update_identity_disputes ON public.identity_disputes;
CREATE POLICY update_identity_disputes ON public.identity_disputes
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.competitions c ON c.id = competition_id
      JOIN public.seasons s ON s.id = c.season_id
      JOIN public.leagues l ON l.id = s.league_id
      WHERE m.scope_type = 'org'
        AND m.scope_id = l.organization_id
        AND m.user_id = (SELECT auth.uid())
        AND m.role IN ('owner', 'admin', 'coordinator')
    )
  );
