-- Repair remote environments whose commerce migrations are recorded as applied
-- but whose permission enum values are missing.
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.read';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.update';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.delete';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'gift_cards.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'gift_cards.read';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'gift_cards.update';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'gift_cards.delete';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'promotions.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'promotions.read';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'promotions.update';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'promotions.delete';
