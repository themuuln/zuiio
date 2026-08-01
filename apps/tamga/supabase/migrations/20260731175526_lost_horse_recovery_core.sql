-- Horse/livestock recovery core: private-by-default reports, reviewed sightings,
-- durable publication/closure transitions, and server-enforced free reporting.
-- This migration is intentionally additive and keeps the lost_horse_* names used
-- by the existing app and Edge Functions.

-- ── Report lifecycle and identity ───────────────────────────────────
ALTER TABLE public.lost_horse_reports
  ALTER COLUMN horse_id DROP NOT NULL,
  ALTER COLUMN horse_name DROP NOT NULL;

ALTER TABLE public.lost_horse_reports
  ADD COLUMN IF NOT EXISTS resolution_type TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS verified_sighting_id UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS identification_description TEXT,
  ADD COLUMN IF NOT EXISTS public_published_at TIMESTAMPTZ;

ALTER TABLE public.lost_horse_reports
  DROP CONSTRAINT IF EXISTS lost_horse_reports_status_check,
  DROP CONSTRAINT IF EXISTS lost_horse_reports_resolution_type_check,
  DROP CONSTRAINT IF EXISTS lost_horse_reports_free_pricing_check,
  ADD CONSTRAINT lost_horse_reports_status_check
    CHECK (status IN ('active', 'found', 'cancelled', 'expired')),
  ADD CONSTRAINT lost_horse_reports_resolution_type_check
    CHECK (resolution_type IS NULL OR resolution_type IN ('reunited', 'withdrawn', 'duplicate', 'expired')),
  ADD CONSTRAINT lost_horse_reports_free_pricing_check
    CHECK (pricing_tier = 'free' OR pricing_tier IS NULL);

ALTER TABLE public.lost_horse_reports
  ALTER COLUMN pricing_tier SET DEFAULT 'free';

CREATE INDEX IF NOT EXISTS idx_lost_horse_owner_status
  ON public.lost_horse_reports(owner_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lost_horse_public_active
  ON public.lost_horse_reports(status, public_access_enabled, created_at DESC)
  WHERE status = 'active' AND public_access_enabled = true;

-- Old policies exposed arbitrary lifecycle writes and a public full-row read.
DROP POLICY IF EXISTS "Owner can CRUD own lost reports" ON public.lost_horse_reports;
DROP POLICY IF EXISTS "Public can read active lost reports" ON public.lost_horse_reports;
DROP POLICY IF EXISTS "lost_horse_reports_owner_select" ON public.lost_horse_reports;
DROP POLICY IF EXISTS "lost_horse_reports_owner_insert" ON public.lost_horse_reports;
DROP POLICY IF EXISTS "lost_horse_reports_owner_update" ON public.lost_horse_reports;
DROP POLICY IF EXISTS "lost_horse_reports_owner_delete" ON public.lost_horse_reports;

CREATE POLICY lost_horse_reports_owner_select
  ON public.lost_horse_reports FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY lost_horse_reports_owner_insert
  ON public.lost_horse_reports FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = owner_id
    AND status = 'active'
    AND public_access_enabled = false
    AND COALESCE(pricing_tier, 'free') = 'free'
    AND expires_at IS NULL
    AND renewal_requested = false
    AND resolution_type IS NULL
    AND resolved_at IS NULL
    AND resolved_by IS NULL
  );

CREATE POLICY lost_horse_reports_owner_update
  ON public.lost_horse_reports FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY lost_horse_reports_owner_delete
  ON public.lost_horse_reports FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = owner_id AND status = 'active' AND public_access_enabled = false);

-- Protected lifecycle columns can only change through the transition RPCs below.
CREATE OR REPLACE FUNCTION public.guard_lost_horse_report_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (SELECT auth.uid()) IS NOT NULL
     AND current_setting('tamga.recovery_transition', true) IS DISTINCT FROM 'true'
  THEN
    IF NEW.status <> OLD.status
       OR NEW.public_access_enabled <> OLD.public_access_enabled
       OR NEW.resolution_type IS DISTINCT FROM OLD.resolution_type
       OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at
       OR NEW.resolved_by IS DISTINCT FROM OLD.resolved_by
       OR NEW.verified_sighting_id IS DISTINCT FROM OLD.verified_sighting_id
       OR NEW.public_published_at IS DISTINCT FROM OLD.public_published_at
    THEN
      RAISE EXCEPTION USING ERRCODE = '42501',
        MESSAGE = 'Recovery lifecycle changes must use an approved transition';
    END IF;

    IF COALESCE(NEW.pricing_tier, 'free') <> 'free'
       OR NEW.expires_at IS NOT NULL
       OR NEW.renewal_requested = true
    THEN
      RAISE EXCEPTION USING ERRCODE = '42501',
        MESSAGE = 'Horse recovery reports are free and cannot be boosted or renewed';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'active'
       OR NEW.public_access_enabled = true
       OR COALESCE(NEW.pricing_tier, 'free') <> 'free'
       OR NEW.expires_at IS NOT NULL
       OR NEW.renewal_requested = true
    THEN
      RAISE EXCEPTION USING ERRCODE = '42501',
        MESSAGE = 'New recovery reports must start active, private, and free';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_lost_horse_report_lifecycle
  ON public.lost_horse_reports;
CREATE TRIGGER trigger_guard_lost_horse_report_lifecycle
  BEFORE INSERT OR UPDATE ON public.lost_horse_reports
  FOR EACH ROW EXECUTE FUNCTION public.guard_lost_horse_report_lifecycle();

REVOKE ALL ON FUNCTION public.guard_lost_horse_report_lifecycle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_lost_horse_report_lifecycle() FROM anon;
REVOKE ALL ON FUNCTION public.guard_lost_horse_report_lifecycle() FROM authenticated;

-- ── Private recovery media ───────────────────────────────────────────
ALTER TABLE public.lost_horse_media
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lost_horse_media_report_path
  ON public.lost_horse_media(report_id, storage_path)
  WHERE storage_path IS NOT NULL;

DROP POLICY IF EXISTS "Owner can manage lost horse media" ON public.lost_horse_media;
DROP POLICY IF EXISTS "Owner can CRUD own lost horse media" ON public.lost_horse_media;
DROP POLICY IF EXISTS "Users can manage own lost horse media" ON public.lost_horse_media;
DROP POLICY IF EXISTS "Public can read lost horse media" ON public.lost_horse_media;

CREATE POLICY lost_horse_media_owner_select
  ON public.lost_horse_media FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lost_horse_reports r
    WHERE r.id = report_id AND r.owner_id = (SELECT auth.uid())
  ));
CREATE POLICY lost_horse_media_owner_insert
  ON public.lost_horse_media FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lost_horse_reports r
    WHERE r.id = report_id AND r.owner_id = (SELECT auth.uid())
  ));
CREATE POLICY lost_horse_media_owner_update
  ON public.lost_horse_media FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lost_horse_reports r
    WHERE r.id = report_id AND r.owner_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lost_horse_reports r
    WHERE r.id = report_id AND r.owner_id = (SELECT auth.uid())
  ));
CREATE POLICY lost_horse_media_owner_delete
  ON public.lost_horse_media FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lost_horse_reports r
    WHERE r.id = report_id AND r.owner_id = (SELECT auth.uid())
  ));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('lost-horse-reports', 'lost-horse-reports', false, 10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),

  ('lost-horse-sightings', 'lost-horse-sightings', false, 10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
ON CONFLICT (id) DO UPDATE SET public = false;
CREATE OR REPLACE FUNCTION public.validate_lost_horse_media_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF NEW.storage_path IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'lost-horse-reports'
      AND name = NEW.storage_path
  ) THEN
    RAISE EXCEPTION 'Recovery media must reference an uploaded storage object';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_lost_horse_media_storage
  ON public.lost_horse_media;
CREATE TRIGGER trigger_validate_lost_horse_media_storage
  BEFORE INSERT OR UPDATE OF storage_path ON public.lost_horse_media
  FOR EACH ROW EXECUTE FUNCTION public.validate_lost_horse_media_storage();
REVOKE ALL ON FUNCTION public.validate_lost_horse_media_storage() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_lost_horse_media_storage() FROM anon;
REVOKE ALL ON FUNCTION public.validate_lost_horse_media_storage() FROM authenticated;

DROP POLICY IF EXISTS lost_horse_report_media_read ON storage.objects;
DROP POLICY IF EXISTS lost_horse_report_media_insert ON storage.objects;
DROP POLICY IF EXISTS lost_horse_report_media_update ON storage.objects;
DROP POLICY IF EXISTS lost_horse_report_media_delete ON storage.objects;

CREATE POLICY lost_horse_report_media_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lost-horse-reports'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
CREATE POLICY lost_horse_report_media_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lost-horse-reports'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
CREATE POLICY lost_horse_report_media_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'lost-horse-reports'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  ) WITH CHECK (
    bucket_id = 'lost-horse-reports'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
CREATE POLICY lost_horse_report_media_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'lost-horse-reports'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY lost_horse_sighting_media_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lost-horse-sightings'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1
        FROM public.lost_horse_reports r
        WHERE r.id::text = (storage.foldername(name))[2]
          AND r.owner_id = (SELECT auth.uid())
      )
    )
  );
CREATE POLICY lost_horse_sighting_media_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lost-horse-sightings'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
CREATE POLICY lost_horse_sighting_media_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'lost-horse-sightings'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  ) WITH CHECK (
    bucket_id = 'lost-horse-sightings'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
CREATE POLICY lost_horse_sighting_media_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'lost-horse-sightings'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- ── Server-owned publication and closure transitions ──────────────────
CREATE OR REPLACE FUNCTION public.publish_lost_horse_submission(
  p_report_id UUID,
  p_expected_media_ids UUID[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report public.lost_horse_reports%ROWTYPE;
  v_media_count INTEGER;
BEGIN
  SELECT * INTO v_report
  FROM public.lost_horse_reports
  WHERE id = p_report_id AND owner_id = (SELECT auth.uid())
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Recovery report not found'; END IF;
  PERFORM set_config('tamga.recovery_transition', 'true', true);
  IF v_report.status <> 'active' THEN
    RAISE EXCEPTION 'Recovery report is not publishable';
  END IF;
  IF v_report.public_access_enabled THEN
    RETURN jsonb_build_object(
      'report_id', p_report_id,
      'public_access_enabled', true,
      'published_at', v_report.public_published_at
    );
  END IF;
  IF COALESCE(v_report.pricing_tier, 'free') <> 'free'
     OR v_report.expires_at IS NOT NULL
     OR v_report.renewal_requested THEN
    RAISE EXCEPTION 'Recovery reports must remain free';
  END IF;
  IF v_report.last_seen_at > now() + interval '5 minutes' THEN
    RAISE EXCEPTION 'Last seen time cannot be in the future';
  END IF;
  IF COALESCE(v_report.lost_count, 0) < 1 THEN
    RAISE EXCEPTION 'At least one animal is required';
  END IF;
  IF COALESCE(length(trim(COALESCE(v_report.identification_description, v_report.description))), 0) < 20
     AND v_report.horse_id IS NULL
     AND v_report.tamga_image_url IS NULL
     AND COALESCE(length(trim(v_report.ear_mark_description)), 0) = 0
     AND COALESCE(length(trim(v_report.horse_name)), 0) = 0
     AND COALESCE(length(trim(v_report.coat_color)), 0) = 0
     AND NOT EXISTS (
       SELECT 1 FROM public.lost_horse_media m
       WHERE m.report_id = p_report_id AND m.media_type = 'photo'
     )
  THEN
    RAISE EXCEPTION 'A useful animal identifier is required';
  END IF;

  SELECT count(*) INTO v_media_count
  FROM public.lost_horse_media
  WHERE report_id = p_report_id
    AND id = ANY(COALESCE(p_expected_media_ids, '{}'))
    AND storage_path IS NOT NULL;
  IF v_media_count <> COALESCE(array_length(p_expected_media_ids, 1), 0) THEN
    RAISE EXCEPTION 'Every selected attachment must be uploaded before publication';
  END IF;

  UPDATE public.lost_horse_reports
  SET public_access_enabled = true,
      public_published_at = COALESCE(public_published_at, now()),
      updated_at = now()
  WHERE id = p_report_id;

  RETURN jsonb_build_object(
    'report_id', p_report_id,
    'public_access_enabled', true,
    'published_at', (SELECT public_published_at FROM public.lost_horse_reports WHERE id = p_report_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_lost_horse_report(
  p_report_id UUID,
  p_resolution_type TEXT,
  p_resolution_note TEXT DEFAULT NULL,
  p_verified_sighting_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report public.lost_horse_reports%ROWTYPE;
  v_status TEXT;
BEGIN
  IF p_resolution_type NOT IN ('reunited', 'withdrawn', 'duplicate') THEN
    RAISE EXCEPTION 'Invalid owner resolution';
  END IF;

  SELECT * INTO v_report
  FROM public.lost_horse_reports
  WHERE id = p_report_id AND owner_id = (SELECT auth.uid())
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recovery report not found'; END IF;
  PERFORM set_config('tamga.recovery_transition', 'true', true);
  IF v_report.status <> 'active' THEN
    IF v_report.resolution_type = p_resolution_type THEN
      RETURN jsonb_build_object(
        'report_id', p_report_id,
        'status', v_report.status,
        'resolution_type', v_report.resolution_type,
        'resolved_at', v_report.resolved_at
      );
    END IF;
    RAISE EXCEPTION 'Recovery report is already closed';
  END IF;

  IF p_verified_sighting_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.lost_horse_sightings s
    WHERE s.id = p_verified_sighting_id
      AND s.report_id = p_report_id
      AND s.status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'Verified sighting does not belong to this report';
  END IF;

  v_status := CASE WHEN p_resolution_type = 'reunited' THEN 'found' ELSE 'cancelled' END;
  UPDATE public.lost_horse_sightings
  SET status = CASE WHEN id = p_verified_sighting_id THEN 'confirmed' ELSE status END,
      reviewed_at = CASE WHEN id = p_verified_sighting_id THEN now() ELSE reviewed_at END,
      reviewed_by = CASE WHEN id = p_verified_sighting_id THEN (SELECT auth.uid()) ELSE reviewed_by END
  WHERE report_id = p_report_id AND id = p_verified_sighting_id;

  UPDATE public.lost_horse_reports
  SET status = v_status,
      resolution_type = p_resolution_type,
      resolved_at = now(),
      resolved_by = (SELECT auth.uid()),
      resolution_note = NULLIF(trim(p_resolution_note), ''),
      public_access_enabled = false,
      updated_at = now()
  WHERE id = p_report_id;

  RETURN jsonb_build_object('report_id', p_report_id, 'status', v_status,
    'resolution_type', p_resolution_type, 'resolved_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_lost_horse_report(p_report_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('tamga.recovery_transition', 'true', true);
  UPDATE public.lost_horse_reports
  SET status = 'expired', resolution_type = 'expired', resolved_at = now(),
      public_access_enabled = false, updated_at = now()
  WHERE id = p_report_id AND status = 'active' AND expires_at IS NOT NULL
    AND expires_at <= now();
  RETURN FOUND;
END;
$$;
CREATE OR REPLACE FUNCTION public.expire_due_lost_horse_reports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  PERFORM set_config('tamga.recovery_transition', 'true', true);
  UPDATE public.lost_horse_reports
  SET status = 'expired',
      resolution_type = 'expired',
      resolved_at = now(),
      public_access_enabled = false,
      updated_at = now()
  WHERE status = 'active'
    AND COALESCE(pricing_tier, 'free') <> 'free'
    AND expires_at IS NOT NULL
    AND expires_at <= now();
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_due_lost_horse_reports() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_due_lost_horse_reports() FROM anon;
REVOKE ALL ON FUNCTION public.expire_due_lost_horse_reports() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_due_lost_horse_reports() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_lost_horse_report(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.publish_lost_horse_submission(UUID, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_lost_horse_submission(UUID, UUID[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.publish_lost_horse_submission(UUID, UUID[]) TO authenticated;
REVOKE ALL ON FUNCTION public.resolve_lost_horse_report(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_lost_horse_report(UUID, TEXT, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_lost_horse_report(UUID, TEXT, TEXT, UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.expire_lost_horse_report(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_lost_horse_report(UUID) FROM anon;

-- ── Sightings: owner/reportant privacy and server review ─────────────
ALTER TABLE public.lost_horse_sightings
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lost_horse_sightings_client_id
  ON public.lost_horse_sightings(client_id) WHERE client_id IS NOT NULL;

DROP POLICY IF EXISTS sightings_select_auth ON public.lost_horse_sightings;
DROP POLICY IF EXISTS sightings_insert_auth ON public.lost_horse_sightings;
DROP POLICY IF EXISTS sightings_update_owner ON public.lost_horse_sightings;
DROP POLICY IF EXISTS sightings_delete_own ON public.lost_horse_sightings;

CREATE POLICY sightings_select_owner_or_reporter
  ON public.lost_horse_sightings FOR SELECT TO authenticated
  USING (
    reporter_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.lost_horse_reports r
      WHERE r.id = report_id AND r.owner_id = (SELECT auth.uid())
    )
  );
CREATE POLICY sightings_insert_reporter
  ON public.lost_horse_sightings FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = (SELECT auth.uid())
    AND status = 'pending'
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
    AND EXISTS (
      SELECT 1 FROM public.lost_horse_reports r
      WHERE r.id = report_id AND r.status = 'active'
    )
  );
CREATE POLICY sightings_update_owner_review
  ON public.lost_horse_sightings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lost_horse_reports r
    WHERE r.id = report_id AND r.owner_id = (SELECT auth.uid())
  ))
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lost_horse_reports r
      WHERE r.id = report_id AND r.owner_id = (SELECT auth.uid())
    )
    AND status IN ('pending', 'confirmed', 'dismissed')
  );
CREATE POLICY sightings_delete_own_unreviewed
  ON public.lost_horse_sightings FOR DELETE TO authenticated
  USING (reporter_id = (SELECT auth.uid()) AND status = 'pending' AND reviewed_at IS NULL);

CREATE OR REPLACE FUNCTION public.validate_lost_horse_sighting_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF NEW.storage_path IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'lost-horse-sightings'
      AND name = NEW.storage_path
  ) THEN
    RAISE EXCEPTION 'Sighting media must reference an uploaded storage object';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_lost_horse_sighting_storage
  ON public.lost_horse_sightings;
CREATE TRIGGER trigger_validate_lost_horse_sighting_storage
  BEFORE INSERT OR UPDATE OF storage_path ON public.lost_horse_sightings
  FOR EACH ROW EXECUTE FUNCTION public.validate_lost_horse_sighting_storage();
REVOKE ALL ON FUNCTION public.validate_lost_horse_sighting_storage() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_lost_horse_sighting_storage() FROM anon;
REVOKE ALL ON FUNCTION public.validate_lost_horse_sighting_storage() FROM authenticated;

CREATE OR REPLACE FUNCTION public.guard_lost_horse_sighting_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lost_horse_reports r
      WHERE r.id = NEW.report_id AND r.owner_id = (SELECT auth.uid())
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Only the report owner can review sightings';
    END IF;
    NEW.reviewed_at := now();
    NEW.reviewed_by := (SELECT auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_guard_lost_horse_sighting_review ON public.lost_horse_sightings;
CREATE TRIGGER trigger_guard_lost_horse_sighting_review
  BEFORE UPDATE ON public.lost_horse_sightings
  FOR EACH ROW EXECUTE FUNCTION public.guard_lost_horse_sighting_review();

CREATE OR REPLACE FUNCTION public.update_sighting_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lost_horse_reports SET sighting_count = sighting_count + 1, updated_at = now()
    WHERE id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lost_horse_reports SET sighting_count = GREATEST(sighting_count - 1, 0), updated_at = now()
    WHERE id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trigger_sighting_count_insert ON public.lost_horse_sightings;
DROP TRIGGER IF EXISTS trigger_sighting_count_delete ON public.lost_horse_sightings;
CREATE TRIGGER trigger_sighting_count_insert AFTER INSERT ON public.lost_horse_sightings
  FOR EACH ROW EXECUTE FUNCTION public.update_sighting_count();
CREATE TRIGGER trigger_sighting_count_delete AFTER DELETE ON public.lost_horse_sightings
  FOR EACH ROW EXECUTE FUNCTION public.update_sighting_count();

REVOKE ALL ON FUNCTION public.guard_lost_horse_sighting_review() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_lost_horse_sighting_review() FROM anon;
REVOKE ALL ON FUNCTION public.guard_lost_horse_sighting_review() FROM authenticated;

-- ── Redacted helper APIs ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.browse_active_lost_horse_reports()
RETURNS TABLE (
  id UUID, horse_name TEXT, description TEXT, animal_type TEXT, lost_count INTEGER,
  location_aimag TEXT, location_sum TEXT, location_bag TEXT, location_name TEXT,
  last_seen_at TIMESTAMPTZ, public_location_precision TEXT, public_contact_mode TEXT,
  photo_count INTEGER, sighting_count INTEGER, created_at TIMESTAMPTZ
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
    (SELECT count(*)::integer FROM public.lost_horse_media m WHERE m.report_id = r.id AND m.media_type = 'photo'),
    r.sighting_count, r.created_at
  FROM public.lost_horse_reports r
  WHERE r.status = 'active' AND r.public_access_enabled = true
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.browse_active_lost_horse_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_active_lost_horse_reports() TO authenticated;

-- ── Alert outbox idempotency and leases ───────────────────────────────
ALTER TABLE public.lost_horse_alert_jobs
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
  ADD COLUMN IF NOT EXISTS claimed_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claim_token UUID;

UPDATE public.lost_horse_alert_jobs
SET dedupe_key = 'legacy:' || id::text
WHERE dedupe_key IS NULL;

ALTER TABLE public.lost_horse_alert_jobs
  ALTER COLUMN dedupe_key SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lost_horse_alert_jobs_dedupe_key
  ON public.lost_horse_alert_jobs(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_lost_horse_alert_jobs_claimable
  ON public.lost_horse_alert_jobs(next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed', 'processing');

DROP FUNCTION IF EXISTS public.claim_lost_horse_alert_jobs(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.claim_lost_horse_alert_jobs(
  p_limit INTEGER DEFAULT 25,
  p_lease_seconds INTEGER DEFAULT 60,
  p_report_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, report_id UUID, event_type TEXT, attempts INTEGER, claim_token UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT j.id
    FROM public.lost_horse_alert_jobs j
    WHERE (p_report_id IS NULL OR j.report_id = p_report_id)
      AND (
        (j.status IN ('pending', 'failed') AND j.next_attempt_at <= now())
        OR (j.status = 'processing' AND (j.claimed_until IS NULL OR j.claimed_until < now()))
      )
    ORDER BY j.next_attempt_at, j.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(p_limit, 1)
  ), claimed AS (
    UPDATE public.lost_horse_alert_jobs j
    SET status = 'processing', attempts = j.attempts + 1,
        locked_at = now(), claimed_until = now() + make_interval(secs => p_lease_seconds),
        claim_token = gen_random_uuid()
    FROM candidates c WHERE j.id = c.id
    RETURNING j.id, j.report_id, j.event_type, j.attempts, j.claim_token
  )
  SELECT * FROM claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_lost_horse_alert_jobs(INTEGER, INTEGER, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_lost_horse_alert_jobs(INTEGER, INTEGER, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_lost_horse_alert_jobs(INTEGER, INTEGER, UUID) TO service_role;

-- New jobs use deterministic event keys. Existing trigger behavior is preserved
-- for legacy rows while preventing duplicate delivery after retries.
CREATE OR REPLACE FUNCTION public.enqueue_lost_horse_alert_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' AND NEW.public_access_enabled THEN
    v_key := 'report_published:' || NEW.id::text;
    INSERT INTO public.lost_horse_alert_jobs (report_id, event_type, dedupe_key)
    VALUES (NEW.id, 'report_published', v_key)
    ON CONFLICT (dedupe_key) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.public_access_enabled AND NOT OLD.public_access_enabled AND NEW.status = 'active' THEN
      v_key := 'report_published:' || NEW.id::text;
      INSERT INTO public.lost_horse_alert_jobs (report_id, event_type, dedupe_key)
      VALUES (NEW.id, 'report_published', v_key)
      ON CONFLICT (dedupe_key) DO NOTHING;
    ELSIF OLD.status = 'active' AND NEW.status IN ('found', 'cancelled', 'expired') THEN
      v_key := 'report_closed:' || NEW.id::text;
      INSERT INTO public.lost_horse_alert_jobs (report_id, event_type, dedupe_key)
      VALUES (NEW.id, 'report_closed', v_key)
      ON CONFLICT (dedupe_key) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_lost_horse_sighting_alert_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lost_horse_alert_jobs (report_id, event_type, dedupe_key)
  SELECT NEW.report_id, 'sighting_created', 'sighting_created:' || NEW.id::text
  FROM public.lost_horse_reports r
  WHERE r.id = NEW.report_id AND r.status = 'active' AND r.public_access_enabled
  ON CONFLICT (dedupe_key) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_lost_horse_alert_job() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_alert_job() FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_alert_job() FROM authenticated;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_sighting_alert_job() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_sighting_alert_job() FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_sighting_alert_job() FROM authenticated;

-- The old triggers remain attached; recreate them to use the hardened functions.
DROP TRIGGER IF EXISTS trigger_enqueue_lost_horse_alert_job ON public.lost_horse_reports;
CREATE TRIGGER trigger_enqueue_lost_horse_alert_job
  AFTER INSERT OR UPDATE OF status, public_access_enabled ON public.lost_horse_reports
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_lost_horse_alert_job();
DROP TRIGGER IF EXISTS trigger_enqueue_lost_horse_sighting_alert_job ON public.lost_horse_sightings;
CREATE TRIGGER trigger_enqueue_lost_horse_sighting_alert_job
  AFTER INSERT ON public.lost_horse_sightings
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_lost_horse_sighting_alert_job();

-- Permissions for the newly added columns are inherited from table grants.
COMMENT ON TABLE public.lost_horse_reports IS
  'Private-by-default, free horse/livestock recovery reports. Public discovery is redacted and RPC-backed.';
