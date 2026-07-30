-- Messenger Agent Links (links Facebook PSID to Zer org)
-- Enables AI chatbot conversations via Facebook Messenger

CREATE TABLE IF NOT EXISTS public.messenger_agent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  psid TEXT NOT NULL UNIQUE,
  page_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.messenger_agent_links IS 'Links Facebook Messenger PSID to Zer organization for AI chatbot';
COMMENT ON COLUMN public.messenger_agent_links.psid IS 'Facebook Page-Scoped ID (unique per user per page)';

ALTER TABLE public.messenger_agent_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messenger_agent_links_org_access" ON public.messenger_agent_links
  USING (organization_id = get_current_organization());

CREATE INDEX IF NOT EXISTS idx_messenger_agent_links_psid ON public.messenger_agent_links(psid);
CREATE INDEX IF NOT EXISTS idx_messenger_agent_links_org ON public.messenger_agent_links(organization_id);
