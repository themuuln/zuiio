-- Lost-horse public sharing and regional alert subscriptions.
-- Public report data is served only through the public-lost-horse Edge Function.

-- ── Public sharing controls ─────────────────────────────────────────
ALTER TABLE public.lost_horse_reports
  ADD COLUMN IF NOT EXISTS public_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS public_access_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_location_precision TEXT NOT NULL DEFAULT 'sum',
  ADD COLUMN IF NOT EXISTS public_contact_mode TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.lost_horse_reports
  DROP CONSTRAINT IF EXISTS lost_horse_reports_public_location_precision_check;

ALTER TABLE public.lost_horse_reports
  ADD CONSTRAINT lost_horse_reports_public_location_precision_check
  CHECK (public_location_precision IN ('aimag', 'sum', 'bag'));

ALTER TABLE public.lost_horse_reports
  DROP CONSTRAINT IF EXISTS lost_horse_reports_public_contact_mode_check;

ALTER TABLE public.lost_horse_reports
  ADD CONSTRAINT lost_horse_reports_public_contact_mode_check
  CHECK (public_contact_mode IN ('none', 'phone'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_lost_horse_public_token_hash
  ON public.lost_horse_reports(public_token_hash)
  WHERE public_token_hash IS NOT NULL;

-- Existing public policies exposed the full report row, including coordinates
-- and contact fields. Public reads now go through the redacted Edge Function.
DROP POLICY IF EXISTS "Public can read active lost reports"
  ON public.lost_horse_reports;
DROP POLICY IF EXISTS "Public can read lost horse media"
  ON public.lost_horse_media;

-- ── Regional subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lost_horse_alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_aimag TEXT NOT NULL,
  location_sum TEXT,
  location_bag TEXT,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lost_horse_alert_subscriptions_active_check
    CHECK (revoked_at IS NULL OR revoked_at >= consented_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lost_horse_alert_subscriptions_scope
  ON public.lost_horse_alert_subscriptions(
    user_id,
    location_aimag,
    COALESCE(location_sum, ''),
    COALESCE(location_bag, '')
  )
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lost_horse_alert_subscriptions_active
  ON public.lost_horse_alert_subscriptions(location_aimag, location_sum)
  WHERE revoked_at IS NULL AND push_enabled = true;

ALTER TABLE public.lost_horse_alert_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their lost horse alert subscriptions"
  ON public.lost_horse_alert_subscriptions
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ── Server-side alert outbox ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lost_horse_alert_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.lost_horse_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('report_published', 'sighting_created', 'report_closed')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'sent', 'failed')
  ),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lost_horse_alert_jobs_pending
  ON public.lost_horse_alert_jobs(next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.lost_horse_alert_jobs ENABLE ROW LEVEL SECURITY;

-- No client access. The alert Edge Function uses the service role.

CREATE OR REPLACE FUNCTION public.enqueue_lost_horse_alert_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     AND NEW.status = 'active'
     AND NEW.public_access_enabled = true THEN
    INSERT INTO public.lost_horse_alert_jobs (report_id, event_type)
    VALUES (NEW.id, 'report_published');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.public_access_enabled = true
       AND OLD.public_access_enabled = false
       AND NEW.status = 'active' THEN
      INSERT INTO public.lost_horse_alert_jobs (report_id, event_type)
      VALUES (NEW.id, 'report_published');
    ELSIF OLD.public_access_enabled = true
          AND OLD.status = 'active'
          AND NEW.status IN ('found', 'cancelled') THEN
      INSERT INTO public.lost_horse_alert_jobs (report_id, event_type)
      VALUES (NEW.id, 'report_closed');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enqueue_lost_horse_alert_job
  ON public.lost_horse_reports;

CREATE TRIGGER trigger_enqueue_lost_horse_alert_job
  AFTER INSERT OR UPDATE OF status, public_access_enabled
  ON public.lost_horse_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_lost_horse_alert_job();

REVOKE ALL ON FUNCTION public.enqueue_lost_horse_alert_job() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_alert_job() FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_alert_job() FROM authenticated;
CREATE OR REPLACE FUNCTION public.enqueue_lost_horse_sighting_alert_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lost_horse_alert_jobs (report_id, event_type)
  SELECT NEW.report_id, 'sighting_created'
  FROM public.lost_horse_reports
  WHERE id = NEW.report_id
    AND status = 'active'
    AND public_access_enabled = true;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enqueue_lost_horse_sighting_alert_job
  ON public.lost_horse_sightings;

CREATE TRIGGER trigger_enqueue_lost_horse_sighting_alert_job
  AFTER INSERT ON public.lost_horse_sightings
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_lost_horse_sighting_alert_job();

REVOKE ALL ON FUNCTION public.enqueue_lost_horse_sighting_alert_job() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_sighting_alert_job() FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_lost_horse_sighting_alert_job() FROM authenticated;
