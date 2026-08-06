-- Migration: lost-horse recovery identity hardening
--
-- Adds two fields from the recovery research (P0 identity card):
--   1. private_verification_detail — an owner-only mark used to verify a
--      claimant before closing a case (never exposed publicly).
--   2. travel_direction — likely direction of travel, a Mongolian recovery
--      notice norm (зүг).
-- Also exposes travel_direction through the public browse RPC so list cards
-- can show it without leaking the private verification detail.

ALTER TABLE public.lost_horse_reports
  ADD COLUMN IF NOT EXISTS private_verification_detail TEXT,
  ADD COLUMN IF NOT EXISTS travel_direction TEXT;

-- Table-level RLS policies cover the new columns; nothing extra needed.

-- ── Redacted browse API: add travel_direction ────────────────────────
CREATE OR REPLACE FUNCTION public.browse_active_lost_horse_reports()
RETURNS TABLE (
  id UUID, horse_name TEXT, description TEXT, animal_type TEXT, lost_count INTEGER,
  location_aimag TEXT, location_sum TEXT, location_bag TEXT, location_name TEXT,
  last_seen_at TIMESTAMPTZ, public_location_precision TEXT, public_contact_mode TEXT,
  travel_direction TEXT, photo_count INTEGER, sighting_count INTEGER, created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.horse_name,
    left(COALESCE(r.description, r.identification_description), 500),
    r.animal_type, r.lost_count,
    r.location_aimag,
    CASE WHEN r.public_location_precision IN ('sum', 'bag') THEN r.location_sum END,
    CASE WHEN r.public_location_precision = 'bag' THEN r.location_bag END,
    CASE WHEN r.public_location_precision = 'bag' THEN r.location_name END,
    r.last_seen_at, r.public_location_precision, r.public_contact_mode,
    r.travel_direction,
    (SELECT count(*)::integer FROM public.lost_horse_media m WHERE m.report_id = r.id AND m.media_type = 'photo'),
    r.sighting_count, r.created_at
  FROM public.lost_horse_reports r
  WHERE r.status = 'active' AND r.public_access_enabled = true
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.browse_active_lost_horse_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_active_lost_horse_reports() TO authenticated;
