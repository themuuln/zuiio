-- =============================================
-- Embeddable analytics tokens
--
-- Tokens let an org embed a read-only analytics report on an external
-- site via iframe (/embed/report?token=...). Only the SHA-256 hash of
-- the raw token is stored; the raw value is returned to the creator
-- exactly once and can never be recovered from the database.
-- =============================================

-- =============================================
-- 1. Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.embed_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  label text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['reports'],
  expires_at timestamptz NOT NULL,
  created_by uuid,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embed_tokens_org ON public.embed_tokens (organization_id);

-- =============================================
-- 2. RLS — org-scoped, permission-gated.
--    Mirrors the canonical org-membership policy from
--    webhook_subscriptions / shared_reports (reports.manage).
-- =============================================
ALTER TABLE public.embed_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS embed_tokens_select_own_org ON public.embed_tokens;
CREATE POLICY embed_tokens_select_own_org ON public.embed_tokens
  FOR SELECT USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reports.manage'::public.app_permission)
  );

DROP POLICY IF EXISTS embed_tokens_insert_own_org ON public.embed_tokens;
CREATE POLICY embed_tokens_insert_own_org ON public.embed_tokens
  FOR INSERT WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reports.manage'::public.app_permission)
  );

DROP POLICY IF EXISTS embed_tokens_update_own_org ON public.embed_tokens;
CREATE POLICY embed_tokens_update_own_org ON public.embed_tokens
  FOR UPDATE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reports.manage'::public.app_permission)
  )
  WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reports.manage'::public.app_permission)
  );

DROP POLICY IF EXISTS embed_tokens_delete_own_org ON public.embed_tokens;
CREATE POLICY embed_tokens_delete_own_org ON public.embed_tokens
  FOR DELETE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reports.manage'::public.app_permission)
  );

-- =============================================
-- 3. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embed_tokens TO authenticated;
GRANT ALL PRIVILEGES ON public.embed_tokens TO service_role;
