-- =============================================
-- Generic Webhooks
--
-- Org-scoped outbound webhook subscriptions for ERP integrations.
-- Subscriptions declare which event types they care about; deliveries
-- record each attempt (status, status code, response, retry count).
-- =============================================

-- =============================================
-- 1. Tables
-- =============================================
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_subs_org ON public.webhook_subscriptions (organization_id);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  status_code INTEGER,
  response_body TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org ON public.webhook_deliveries (organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_sub ON public.webhook_deliveries (subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries (organization_id, status);

-- =============================================
-- 2. RLS
-- =============================================
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_subscriptions_select_own_org ON public.webhook_subscriptions;
CREATE POLICY webhook_subscriptions_select_own_org ON public.webhook_subscriptions
  FOR SELECT USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.read'::public.app_permission)
  );

DROP POLICY IF EXISTS webhook_subscriptions_insert_own_org ON public.webhook_subscriptions;
CREATE POLICY webhook_subscriptions_insert_own_org ON public.webhook_subscriptions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.create'::public.app_permission)
  );

DROP POLICY IF EXISTS webhook_subscriptions_update_own_org ON public.webhook_subscriptions;
CREATE POLICY webhook_subscriptions_update_own_org ON public.webhook_subscriptions
  FOR UPDATE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.update'::public.app_permission)
  )
  WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.update'::public.app_permission)
  );

DROP POLICY IF EXISTS webhook_subscriptions_delete_own_org ON public.webhook_subscriptions;
CREATE POLICY webhook_subscriptions_delete_own_org ON public.webhook_subscriptions
  FOR DELETE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.delete'::public.app_permission)
  );

DROP POLICY IF EXISTS webhook_deliveries_select_own_org ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_select_own_org ON public.webhook_deliveries
  FOR SELECT USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.read'::public.app_permission)
  );

DROP POLICY IF EXISTS webhook_deliveries_insert_own_org ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_insert_own_org ON public.webhook_deliveries
  FOR INSERT WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.create'::public.app_permission)
  );

DROP POLICY IF EXISTS webhook_deliveries_update_own_org ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_update_own_org ON public.webhook_deliveries
  FOR UPDATE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.update'::public.app_permission)
  )
  WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.update'::public.app_permission)
  );

DROP POLICY IF EXISTS webhook_deliveries_delete_own_org ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_delete_own_org ON public.webhook_deliveries
  FOR DELETE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('webhooks.delete'::public.app_permission)
  );

-- =============================================
-- 3. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_deliveries TO authenticated;
GRANT ALL PRIVILEGES ON public.webhook_subscriptions, public.webhook_deliveries TO service_role;

-- =============================================
-- 4. Backfill new permissions for existing orgs
-- =============================================
DO $$
DECLARE
  v_role RECORD;
  v_perm public.app_permission;
BEGIN
  FOR v_role IN
    SELECT DISTINCT r.id AS role_id
    FROM public.roles r
    WHERE r.is_system_role = true
      AND r.hierarchy_level IN (0, 1)
  LOOP
    FOR v_perm IN
      SELECT unnest(
        ARRAY[
          'webhooks.create',
          'webhooks.read',
          'webhooks.update',
          'webhooks.delete'
        ]::public.app_permission[]
      )
    LOOP
      INSERT INTO public.role_permissions (role_id, permission)
      VALUES (v_role.role_id, v_perm)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
