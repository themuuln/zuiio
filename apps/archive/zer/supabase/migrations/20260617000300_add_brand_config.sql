-- Add brand_config column to organizations table for multi-tenant branding
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS brand_config JSONB DEFAULT '{}'::jsonb;
