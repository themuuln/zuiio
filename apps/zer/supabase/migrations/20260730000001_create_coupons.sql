-- =============================================
-- Coupon System
--
-- Customer-facing discount codes for checkout.
-- Separate from admin-only "discounts" table.
-- =============================================

-- =============================================
-- 1. Add coupon permissions to app_permission enum
-- =============================================
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2. Coupons table
-- =============================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(12, 2) NOT NULL,
  min_purchase_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(12, 2),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'selected_products', 'selected_categories')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- =============================================
-- 3. Coupon usage tracking (per-customer limits)
-- =============================================
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 4. Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_coupons_org ON public.coupons(organization_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(organization_id, code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_contact ON public.coupon_usage(contact_id);

-- =============================================
-- 5. RLS
-- =============================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT, INSERT ON public.coupon_usage TO authenticated;
