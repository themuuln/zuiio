-- =============================================
-- Web Push subscriptions
--
-- Per-user browser push subscriptions for org-scoped web push
-- notifications. Each row is owned by the user who registered the
-- browser endpoint (RLS: auth.uid() = user_id).
-- =============================================

-- =============================================
-- 1. Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org_user
  ON public.push_subscriptions (organization_id, user_id);

-- =============================================
-- 2. RLS
--
-- Users may manage only their own subscriptions (auth.uid() = user_id).
-- UPDATE is required for upsert-by-endpoint (re-subscribing refreshes
-- the p256dh/auth keys in place).
-- =============================================
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_select_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_select_own ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS push_subscriptions_insert_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_insert_own ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS push_subscriptions_update_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_update_own ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS push_subscriptions_delete_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_delete_own ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL PRIVILEGES ON public.push_subscriptions TO service_role;

-- =============================================
-- 4. Allow web push delivery logs in the notifications table
-- =============================================
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_channel_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_channel_check
  CHECK (channel IN ('telegram', 'email', 'web_push'));
