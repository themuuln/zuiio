-- ============================================================
-- Harden bay-view PIN verification with a brute-force lockout
-- ============================================================
-- The verify RPC previously allowed unlimited guesses against a
-- bcrypt hash (4-6 digit PIN space). Add a durable per-user +
-- per-organization lockout: after 5 failed attempts within 15
-- minutes, verification returns false until the window lapses.
-- A successful verification clears the failure window.
--
-- The attempts table is RLS-denied (no policies) and only touched
-- by the SECURITY DEFINER function (owner context), so clients
-- cannot read or manipulate the failure records directly.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.org_pin_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_pin_attempts_user_org_idx
ON public.org_pin_attempts (user_id, organization_id, failed_at);

ALTER TABLE public.org_pin_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.verify_organization_bay_view_pin(
  target_org_id uuid,
  plain_pin text
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  stored_hash text;
  recent_failures INT;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF plain_pin IS NULL OR plain_pin !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'PIN must be 4 to 6 digits';
  END IF;

  -- Prune stale records so the table does not grow unboundedly.
  DELETE FROM public.org_pin_attempts
  WHERE failed_at < now() - interval '1 day';

  -- Lockout: 5 failed attempts within the last 15 minutes block verification.
  SELECT count(*)
  INTO recent_failures
  FROM public.org_pin_attempts
  WHERE user_id = current_user_id
    AND organization_id = target_org_id
    AND failed_at > now() - interval '15 minutes';

  IF recent_failures >= 5 THEN
    RETURN false;
  END IF;

  SELECT o.settings ->> 'bay_view_pin_hash'
  INTO stored_hash
  FROM public.organizations o
  JOIN public.organization_users ou
    ON ou.organization_id = o.id
  WHERE ou.user_id = current_user_id
    AND o.id = target_org_id
    AND o.deleted_at IS NULL
  LIMIT 1;

  IF stored_hash IS NULL OR stored_hash = '' THEN
    RETURN false;
  END IF;

  IF extensions.crypt(plain_pin, stored_hash) = stored_hash THEN
    -- Success clears the failure window.
    DELETE FROM public.org_pin_attempts
    WHERE user_id = current_user_id
      AND organization_id = target_org_id;
    RETURN true;
  END IF;

  -- Record the failure.
  INSERT INTO public.org_pin_attempts (user_id, organization_id)
  VALUES (current_user_id, target_org_id);

  RETURN false;
END;
$$;

-- Match the current grant state (authenticated per 20260715063708,
-- service_role per 20260806070000). CREATE OR REPLACE preserves
-- existing grants; explicit GRANTs keep the file self-contained for
-- fresh environments.
GRANT EXECUTE ON FUNCTION public.verify_organization_bay_view_pin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_organization_bay_view_pin(uuid, text) TO service_role;
