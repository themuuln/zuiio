-- =============================================
-- Migration: Add soft-delete support for products
--
-- Adds deleted_at timestamp column to the products
-- table so products can be soft-deleted instead
-- of hard-deleted, preserving referential integrity
-- for historical data.
-- =============================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update the product_variants.is_active default to true if not already set
-- (This ensures variants created after migrations are active by default)
ALTER TABLE public.product_variants
ALTER COLUMN is_active SET DEFAULT true;
