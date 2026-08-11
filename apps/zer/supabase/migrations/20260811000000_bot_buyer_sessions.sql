-- =============================================
-- Bot buyer sessions — AI chat commerce entry points
-- =============================================
-- Buyers start shopping with a shop's Telegram bot / Messenger page via a
-- deep link that carries the org slug (t.me/<bot>?start=<slug> or
-- m.me/<page>?ref=<slug>). The webhook binds the buyer's external id to the
-- organization in this table; every subsequent message runs the buyer
-- agent (public catalog + place_order) against that shop.
--
-- Merchant-side bot links (telegram_agent_links / messenger_agent_links)
-- are intentionally separate and keep their own flow.
-- =============================================

CREATE TABLE IF NOT EXISTS public.bot_buyer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('telegram', 'messenger')),
  external_id text NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, external_id)
);

-- Buyer lookups always filter by (channel, external_id).
CREATE INDEX IF NOT EXISTS idx_bot_buyer_sessions_channel_ext
  ON public.bot_buyer_sessions(channel, external_id);

-- Bots run server-side with the service role; buyers never touch this table
-- directly. No anon/authenticated grants are needed.
ALTER TABLE public.bot_buyer_sessions ENABLE ROW LEVEL SECURITY;
