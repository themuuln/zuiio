-- ============================================================================
-- Phase 8 T-8.2 — Roster snapshots, transfers, and eligibility
-- ============================================================================

-- ── Roster snapshots: frozen roster for a competition entry ───────────────
-- A snapshot captures exactly which players were on a team's roster when the
-- competition started (or when the snapshot was taken for mid-season entries).
CREATE TABLE IF NOT EXISTS public.roster_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  jersey_number smallint CHECK (jersey_number IS NULL OR jersey_number BETWEEN 0 AND 99),
  position text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'injured', 'suspended', 'ineligible', 'transferred_out')),
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_season_id, player_id)
);

CREATE INDEX IF NOT EXISTS roster_snapshots_team_idx ON public.roster_snapshots (team_season_id);
CREATE INDEX IF NOT EXISTS roster_snapshots_player_idx ON public.roster_snapshots (player_id);

ALTER TABLE public.roster_snapshots ENABLE ROW LEVEL SECURITY;

-- Public can see roster snapshots for verified/official games
CREATE POLICY public_read_roster_snapshots ON public.roster_snapshots
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.team_seasons ts
      JOIN public.competitions c ON c.id = ts.competition_id
      JOIN public.seasons s ON s.id = c.season_id
      JOIN public.leagues l ON l.id = s.league_id
      WHERE ts.id = team_season_id
    )
  );

-- ── Transfer records ──────────────────────────────────────────────────────
CREATE TYPE public.transfer_type AS ENUM ('permanent', 'loan', 'free_agent', 'youth_promotion');

CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  from_team_season_id uuid REFERENCES public.team_seasons(id) ON DELETE RESTRICT,
  to_team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE RESTRICT,
  transfer_type public.transfer_type NOT NULL DEFAULT 'permanent',
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  effective_from date NOT NULL,
  effective_until date,
  note text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_team_season_id IS DISTINCT FROM to_team_season_id)
);

CREATE INDEX IF NOT EXISTS transfers_player_idx ON public.transfers (player_id);
CREATE INDEX IF NOT EXISTS transfers_from_idx ON public.transfers (from_team_season_id);
CREATE INDEX IF NOT EXISTS transfers_to_idx ON public.transfers (to_team_season_id);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- ── RLS for transfers ─────────────────────────────────────────────────────
CREATE POLICY public_read_transfers ON public.transfers
  FOR SELECT TO anon, authenticated USING (approved_at IS NOT NULL);

CREATE POLICY authenticated_read_transfers ON public.transfers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY admin_write_transfers ON public.transfers
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.team_seasons ts ON ts.id = to_team_season_id
      JOIN public.competitions c ON c.id = ts.competition_id
      JOIN public.seasons s ON s.id = c.season_id
      JOIN public.leagues l ON l.id = s.league_id
      WHERE m.scope_type = 'org'
        AND m.scope_id = l.organization_id
        AND m.user_id = (SELECT auth.uid())
        AND m.role IN ('owner', 'admin', 'coordinator')
    )
  );

-- ── Helper: create roster snapshot for a competition from active roster entries ──
CREATE OR REPLACE FUNCTION public.cmd_snapshot_roster(
  p_team_season_id uuid
) RETURNS SETOF public.roster_snapshots LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
BEGIN
  -- Authorization: must be org admin/owner
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = p_team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org'
      AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'coordinator')
  ) THEN RAISE EXCEPTION 'not authorized';
  END IF;

  -- Delete existing snapshots for this team_season and re-create
  DELETE FROM public.roster_snapshots WHERE team_season_id = p_team_season_id;

  RETURN QUERY
  INSERT INTO public.roster_snapshots (team_season_id, player_id, jersey_number, position)
  SELECT
    re.team_season_id,
    re.player_id,
    re.jersey_number,
    re.position
  FROM public.roster_entries re
  WHERE re.team_season_id = p_team_season_id
    AND (re.left_at IS NULL OR re.left_at >= CURRENT_DATE)
  ON CONFLICT (team_season_id, player_id) DO NOTHING
  RETURNING *;

  PERFORM private.write_audit('snapshot_roster', 'roster_snapshot', p_team_season_id,
    jsonb_build_object('team_season_id', p_team_season_id));
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_snapshot_roster FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_snapshot_roster TO authenticated;

-- ── Helper: check if player is eligible for a competition ─────────────────
CREATE OR REPLACE FUNCTION public.cmd_check_eligibility(
  p_player_id uuid,
  p_competition_id uuid
) RETURNS TABLE(
  eligible boolean,
  team_name text,
  reason text
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS eligible,
    t.name AS team_name,
    'Идэвхтэй бүртгэлтэй'::text AS reason
  FROM public.roster_snapshots rs
  JOIN public.team_seasons ts ON ts.id = rs.team_season_id
  JOIN public.teams t ON t.id = ts.team_id
  WHERE rs.player_id = p_player_id
    AND ts.competition_id = p_competition_id
    AND rs.status = 'active'

  UNION ALL

  SELECT
    false,
    NULL::text,
    'Тэмцээнд бүртгэлгүй'::text
  WHERE NOT EXISTS (
    SELECT 1 FROM public.roster_snapshots rs
    JOIN public.team_seasons ts ON ts.id = rs.team_season_id
    WHERE rs.player_id = p_player_id
      AND ts.competition_id = p_competition_id
      AND rs.status = 'active'
  )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_check_eligibility FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_check_eligibility TO authenticated;

-- ── Helper: record a transfer ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cmd_record_transfer(
  p_player_id uuid,
  p_from_team_season_id uuid,
  p_to_team_season_id uuid,
  p_transfer_type text,
  p_effective_from date,
  p_note text DEFAULT NULL
) RETURNS public.transfers LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_transfer public.transfers;
BEGIN
  -- Authorization (same as snapshot)
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = COALESCE(p_from_team_season_id, p_to_team_season_id)
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org'
      AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'admin', 'coordinator')
  ) THEN RAISE EXCEPTION 'not authorized';
  END IF;

  -- Update the player's current roster entry to mark them as left
  IF p_from_team_season_id IS NOT NULL THEN
    UPDATE public.roster_entries
    SET left_at = p_effective_from
    WHERE team_season_id = p_from_team_season_id
      AND player_id = p_player_id
      AND left_at IS NULL;
  END IF;

  INSERT INTO public.transfers (
    player_id, from_team_season_id, to_team_season_id,
    transfer_type, effective_from, note, created_by
  ) VALUES (
    p_player_id, p_from_team_season_id, p_to_team_season_id,
    p_transfer_type::public.transfer_type, p_effective_from, p_note,
    (SELECT auth.uid())
  ) RETURNING * INTO v_transfer;

  PERFORM private.write_audit('record_transfer', 'transfer', v_transfer.id,
    jsonb_build_object('player_id', p_player_id, 'to_team_season', p_to_team_season_id));
  RETURN v_transfer;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_record_transfer FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_record_transfer TO authenticated;
