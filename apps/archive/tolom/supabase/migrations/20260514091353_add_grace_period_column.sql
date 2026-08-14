-- Add missing grace_period_end column to subscription_plans
-- This column is referenced by 3 RPCs:
--   - check_org_subscription_status
--   - create_default_subscription
--   - renew_organization_subscription
-- but was never added to the table DDL. This is a live bug fix.

alter table subscription_plans
  add column if not exists grace_period_end timestamptz;
