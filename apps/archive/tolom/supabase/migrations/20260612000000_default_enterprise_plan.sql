-- Upgrade all existing orgs to enterprise plan (all features enabled)
-- Created: 2026-06-12

-- Update all existing subscription_plans to enterprise
UPDATE public.subscription_plans
SET
    plan_type = 'enterprise'::public.plan_type,
    updated_at = now()
WHERE plan_type != 'enterprise';
