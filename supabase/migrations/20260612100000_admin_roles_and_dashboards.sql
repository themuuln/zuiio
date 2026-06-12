-- Admin roles: seller, marketing_manager
-- Created: 2026-06-12

-- 1. Add role column to super_admins
ALTER TABLE public.super_admins
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'super_admin'
  CHECK (role IN ('super_admin', 'seller', 'marketing_manager'));

-- Backfill existing rows as super_admin (already the default)
UPDATE public.super_admins SET role = 'super_admin' WHERE role IS NULL;

-- 2. Seller assignments (which orgs a seller manages)
CREATE TABLE IF NOT EXISTS public.seller_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.super_admins(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(seller_id, organization_id)
);

ALTER TABLE public.seller_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage seller assignments"
  ON public.seller_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

-- 3. Marketing campaigns
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'push', 'all')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  target_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  clicked_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.super_admins(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_seller_assignments_seller ON public.seller_assignments(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_assignments_org ON public.seller_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_org ON public.marketing_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);

-- 5. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
