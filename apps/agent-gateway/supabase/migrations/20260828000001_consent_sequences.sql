-- Consent-aware sequences and broadcasts.
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('messenger','instagram','telegram','whatsapp')),
  channel_user_id text NOT NULL,
  page_id text,
  consent_type text NOT NULL CHECK (consent_type IN ('broadcast','sequence','opt_in')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  source text NOT NULL CHECK (source IN ('quick_reply','postback','ref')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_consents_lookup ON public.user_consents(organization_id, channel, channel_user_id, consent_type);
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents FORCE ROW LEVEL SECURITY;
-- Dashboard and workers use the service role; no client role receives access.
REVOKE ALL ON public.user_consents FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel text NOT NULL,
  message text NOT NULL,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.broadcasts FROM anon, authenticated;
