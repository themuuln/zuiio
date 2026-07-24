-- Add org setting to control whether the shop enforces stock levels.
-- When false, the POS/shop treats every product as available (no "out of stock"
-- state, no disabled add button, and hides stock numbers). This unblocks shops
-- that sell without tracking inventory or haven't configured an initial stock.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_track_stock BOOLEAN DEFAULT true;

-- Existing organizations keep stock tracking on (no behavior change).
UPDATE public.organizations
SET has_track_stock = COALESCE(has_track_stock, true);
