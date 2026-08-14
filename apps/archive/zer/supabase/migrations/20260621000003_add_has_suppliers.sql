-- Add has_suppliers column to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_suppliers BOOLEAN DEFAULT true;

-- Existing organizations keep supplier functionality by default
UPDATE public.organizations
SET has_suppliers = true
WHERE has_suppliers IS NULL;
