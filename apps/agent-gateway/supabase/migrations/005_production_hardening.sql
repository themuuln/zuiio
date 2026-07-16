-- 005_production_hardening.sql
-- Aligns the standalone gateway schema with the Zer production database.

ALTER TABLE public.telegram_links
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.telegram_links
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN linked_at SET DEFAULT now(),
  ALTER COLUMN last_active_at SET DEFAULT now();

UPDATE public.telegram_links
SET notification_preferences = jsonb_build_object('productType', product_type)
WHERE notification_preferences = '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_telegram_links_active_chat_user
  ON public.telegram_links (telegram_chat_id, telegram_user_id, updated_at DESC)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_telegram_links_org_user
  ON public.telegram_links (organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_one_time_tokens_unused_expiry
  ON public.one_time_tokens (expires_at)
  WHERE used_at IS NULL;

ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_daily_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_bots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS telegram_links_select ON public.telegram_links;
CREATE POLICY telegram_links_select
  ON public.telegram_links FOR SELECT
  USING (organization_id = (SELECT get_current_organization()));

CREATE OR REPLACE FUNCTION public.increment_daily_spend(
  p_org_id UUID,
  p_date DATE,
  p_tokens BIGINT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_daily_spend (organization_id, date, tokens_used, api_calls)
  VALUES (p_org_id, p_date, p_tokens, 1)
  ON CONFLICT (organization_id, date)
  DO UPDATE SET
    tokens_used = public.agent_daily_spend.tokens_used + p_tokens,
    api_calls = public.agent_daily_spend.api_calls + 1,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_daily_spend(UUID, DATE, BIGINT) FROM PUBLIC;
