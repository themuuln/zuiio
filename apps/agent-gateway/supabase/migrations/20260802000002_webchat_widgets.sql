-- 20260802000002_webchat_widgets.sql
-- Embeddable web chat widget configuration.
--
-- The gateway runs on the service-role client (RLS-bypassing) and resolves
-- tenancy in app code. Like channel_connections: RLS enabled + FORCED with no
-- policies — anon/authenticated roles get nothing, only the service role can
-- read or write widget config.

CREATE TABLE IF NOT EXISTS public.agent_webchat_widgets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_type    text NOT NULL CHECK (product_type IN ('tolom', 'zer')),
  widget_key      uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  display_name    text,
  greeting        text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_webchat_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_webchat_widgets FORCE ROW LEVEL SECURITY;
