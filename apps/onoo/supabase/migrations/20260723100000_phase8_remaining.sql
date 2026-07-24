-- ============================================================================
-- Phase 8 T-8.4 through T-8.6 — Remaining org foundation features
-- ============================================================================

-- T-8.4: Private storage buckets (already created via Supabase dashboard, just need tracking table)
CREATE TABLE IF NOT EXISTS public.org_storage_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bucket_name text NOT NULL,
  bucket_id text NOT NULL,
  is_tenant_isolation boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.org_storage_buckets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_org_storage_buckets ON public.org_storage_buckets;
CREATE POLICY read_org_storage_buckets ON public.org_storage_buckets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS write_org_storage_buckets ON public.org_storage_buckets;
CREATE POLICY write_org_storage_buckets ON public.org_storage_buckets FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM memberships WHERE scope_type='org' AND scope_id=organization_id AND user_id=(SELECT auth.uid()) AND role IN ('owner','admin')));

-- T-8.5: Consent & retention policies
CREATE TABLE IF NOT EXISTS public.consent_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  retention_days int NOT NULL DEFAULT 365,
  data_categories text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.consent_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_consent_policies ON public.consent_policies;
CREATE POLICY read_consent_policies ON public.consent_policies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS write_consent_policies ON public.consent_policies;
CREATE POLICY write_consent_policies ON public.consent_policies FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM memberships WHERE scope_type='org' AND scope_id=organization_id AND user_id=(SELECT auth.uid()) AND role IN ('owner','admin')));
DROP POLICY IF EXISTS update_consent_policies ON public.consent_policies;
CREATE POLICY update_consent_policies ON public.consent_policies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS delete_consent_policies ON public.consent_policies;
CREATE POLICY delete_consent_policies ON public.consent_policies FOR DELETE TO authenticated USING (true);

-- T-8.6: Break-glass emergency access
CREATE TABLE IF NOT EXISTS public.break_glass_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  granted_to uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_expired boolean DEFAULT false,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.break_glass_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_break_glass ON public.break_glass_access;
CREATE POLICY read_break_glass ON public.break_glass_access FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM memberships WHERE scope_type='org' AND scope_id=organization_id AND user_id=(SELECT auth.uid()) AND role IN ('owner','admin')));
DROP POLICY IF EXISTS write_break_glass ON public.break_glass_access;
CREATE POLICY write_break_glass ON public.break_glass_access FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM memberships WHERE scope_type='org' AND scope_id=organization_id AND user_id=(SELECT auth.uid()) AND role IN ('owner','admin')));
DROP POLICY IF EXISTS update_break_glass ON public.break_glass_access;
CREATE POLICY update_break_glass ON public.break_glass_access FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
