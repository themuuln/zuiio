-- Add social_links column to organization_public_profiles
-- JSONB to store social media links like:
-- {"facebook": "https://facebook.com/...", "instagram": "...", "twitter": "...", "youtube": "..."}

ALTER TABLE public.organization_public_profiles
ADD COLUMN IF NOT EXISTS social_links JSONB;

COMMENT ON COLUMN public.organization_public_profiles.social_links IS 'Social media links as key-value pairs (platform -> URL)';
