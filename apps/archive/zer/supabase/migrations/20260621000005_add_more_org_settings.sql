-- Add remaining org feature toggles for granular UI gating
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_uom BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_brands BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_categories BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_email_reports BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_audit_log BOOLEAN DEFAULT true;

-- Existing organizations keep sensible defaults
UPDATE public.organizations
SET has_variants = COALESCE(has_variants, true),
    has_uom = COALESCE(has_uom, false),
    has_brands = COALESCE(has_brands, true),
    has_categories = COALESCE(has_categories, true),
    has_email_reports = COALESCE(has_email_reports, false),
    has_audit_log = COALESCE(has_audit_log, true);
