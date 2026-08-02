-- Add feature toggles used by the dashboard and organization settings.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_hr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_coupons BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_gift_cards BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_promotions BOOLEAN DEFAULT true;

-- Existing organizations keep the features enabled unless explicitly disabled.
UPDATE public.organizations
SET has_hr = COALESCE(has_hr, false),
    has_coupons = COALESCE(has_coupons, true),
    has_gift_cards = COALESCE(has_gift_cards, true),
    has_promotions = COALESCE(has_promotions, true);
