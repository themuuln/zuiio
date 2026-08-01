-- Phase 3 — Marketplace ⇄ Recovery connection
-- Server-enforced lost/stolen listing guard:
--   1. market_listings.lost_report_conflict flags listings whose horse has an
--      active, publicly published recovery report.
--   2. Creating a NEW listing for such a horse is blocked (raise).
--   3. Publishing (status -> 'active') a listing whose horse has an active
--      public report is blocked.
--   4. When a recovery report is published for a horse, its non-terminal
--      listings are flagged; when the report resolves (found/cancelled/expired)
--      or becomes unpublished, the flag is cleared.
-- Additive and idempotent: safe to re-run.

-- ── 1. Flag column and lookup index ────────────────────────────────────────

ALTER TABLE public.market_listings
  ADD COLUMN IF NOT EXISTS lost_report_conflict BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_market_listings_lost_conflict
  ON public.market_listings(horse_id)
  WHERE lost_report_conflict = true;

-- ── 2. Helper: active publicly published recovery report for a horse ───────

CREATE OR REPLACE FUNCTION public.active_public_lost_report_for_horse(
  p_horse_id UUID
)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.lost_horse_reports
  WHERE horse_id = p_horse_id
    AND status = 'active'
    AND public_access_enabled = true
    AND resolved_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.active_public_lost_report_for_horse(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.active_public_lost_report_for_horse(UUID)
  TO authenticated, service_role;

-- ── 3. Guard on market_listings INSERT/UPDATE ──────────────────────────────

CREATE OR REPLACE FUNCTION public.market_listings_lost_report_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- A brand-new listing for a horse that is publicly reported lost is suspect.
    v_report_id := public.active_public_lost_report_for_horse(NEW.horse_id);
    IF v_report_id IS NOT NULL THEN
      RAISE EXCEPTION 'lost_report_active:%', v_report_id
        USING ERRCODE = 'P0001';
    END IF;
    NEW.lost_report_conflict := false;
    RETURN NEW;
  END IF;

  -- UPDATE: block publishing (status -> active) while a report is active,
  -- and always keep the conflict flag in sync with the report state.
  IF NEW.horse_id IS DISTINCT FROM OLD.horse_id
     OR NEW.status IS DISTINCT FROM OLD.status THEN
    v_report_id := public.active_public_lost_report_for_horse(NEW.horse_id);
    IF NEW.status = 'active' AND v_report_id IS NOT NULL THEN
      RAISE EXCEPTION 'lost_report_active:%', v_report_id
        USING ERRCODE = 'P0001';
    END IF;
    NEW.lost_report_conflict := v_report_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS market_listings_lost_report_guard_trigger
  ON public.market_listings;
CREATE TRIGGER market_listings_lost_report_guard_trigger
  BEFORE INSERT OR UPDATE OF horse_id, status ON public.market_listings
  FOR EACH ROW EXECUTE FUNCTION public.market_listings_lost_report_guard();

-- ── 4. Flag/clear listings when a recovery report changes ─────────────────

CREATE OR REPLACE FUNCTION public.flag_listings_on_lost_report_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.horse_id IS NULL THEN
    RETURN NEW; -- manual livestock reports have no registry horse link
  END IF;

  IF NEW.status = 'active' AND NEW.public_access_enabled = true THEN
    -- Report is publicly active: flag every non-terminal listing for this horse.
    UPDATE public.market_listings
    SET lost_report_conflict = true,
        updated_at = now()
    WHERE horse_id = NEW.horse_id
      AND status IN ('active', 'pending_verification')
      AND lost_report_conflict = false;
  ELSE
    -- Report resolved or unpublished: clear the guard for non-terminal listings.
    UPDATE public.market_listings
    SET lost_report_conflict = false,
        updated_at = now()
    WHERE horse_id = NEW.horse_id
      AND status IN ('active', 'pending_verification')
      AND lost_report_conflict = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flag_listings_on_lost_report_change_trigger
  ON public.lost_horse_reports;
CREATE TRIGGER flag_listings_on_lost_report_change_trigger
  AFTER INSERT OR UPDATE OF status, public_access_enabled, resolution_type
  ON public.lost_horse_reports
  FOR EACH ROW EXECUTE FUNCTION public.flag_listings_on_lost_report_change();
