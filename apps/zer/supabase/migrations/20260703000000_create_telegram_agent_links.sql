-- =============================================
-- Migration: Telegram Agent Identity Links
-- Maps Telegram chat_id → organization_id for the AI chatbot agent.
-- Separate from notification_configs (outbound-only) — this is for
-- inbound user identity resolution.
-- =============================================

CREATE TABLE IF NOT EXISTS public.telegram_agent_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  telegram_username TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(telegram_chat_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.telegram_agent_links ENABLE ROW LEVEL SECURITY;

-- RLS policies (users manage their own link; no UPDATE needed)
CREATE POLICY "telegram_agent_links_select"
  ON public.telegram_agent_links FOR SELECT
  USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "telegram_agent_links_insert"
  ON public.telegram_agent_links FOR INSERT
  WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "telegram_agent_links_delete"
  ON public.telegram_agent_links FOR DELETE
  USING (organization_id = (SELECT get_current_organization()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telegram_agent_links_chat_id
  ON public.telegram_agent_links(telegram_chat_id);

CREATE INDEX IF NOT EXISTS idx_telegram_agent_links_org_id
  ON public.telegram_agent_links(organization_id);
