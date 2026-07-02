-- Add salesperson_id to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS salesperson_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add commission_amount to sale_items
ALTER TABLE public.sale_items
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Create commission_payouts table
CREATE TABLE IF NOT EXISTS public.commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create commission_payout_items table
CREATE TABLE IF NOT EXISTS public.commission_payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID REFERENCES public.commission_payouts(id) ON DELETE CASCADE NOT NULL,
  sale_item_id UUID REFERENCES public.sale_items(id) ON DELETE CASCADE NOT NULL,
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT commission_payout_items_sale_item_id_key UNIQUE (sale_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commission_payouts_organization_id ON public.commission_payouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_profile_id ON public.commission_payouts(profile_id);
CREATE INDEX IF NOT EXISTS idx_commission_payout_items_payout_id ON public.commission_payout_items(payout_id);
