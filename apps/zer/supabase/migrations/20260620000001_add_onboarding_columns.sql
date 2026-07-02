-- Add onboarding columns to organizations table
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS enabled_features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Mark existing organizations as completed
UPDATE public.organizations
SET onboarding_completed = true
WHERE onboarding_completed IS NULL OR onboarding_completed = false;
