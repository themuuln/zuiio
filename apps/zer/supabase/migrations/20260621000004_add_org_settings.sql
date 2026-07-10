-- Add organization feature settings for granular UI gating
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_inventory BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_customer_credit BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_multi_branch BOOLEAN DEFAULT false;

-- Existing organizations keep all features
UPDATE public.organizations
SET has_inventory = COALESCE(has_inventory, true),
    has_customer_credit = COALESCE(has_customer_credit, true),
    has_multi_branch = COALESCE(has_multi_branch, true);
