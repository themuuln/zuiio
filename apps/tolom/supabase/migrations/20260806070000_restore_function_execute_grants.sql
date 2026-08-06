-- Restore EXECUTE grants on functions revoked from PUBLIC by
-- 20260715061523_fix_security_definer_public_grants.sql.
--
-- The revoke migration removed PUBLIC EXECUTE (correct hardening) but never
-- re-granted the roles that legitimately call these functions:
--   - authenticated/anon: functions invoked from user-context triggers and RPCs
--     (e.g. queue_notification fires from the work_orders status-change trigger,
--     so a missing grant breaks every status transition with 42501).
--   - service_role: server-side RPC calls (device registration, inventory
--     balance refresh, org seeding, etc.).
--
-- These grants mirror the production ACLs (verified 2026-08-06); they were
-- previously applied out-of-band in prod, so fresh environments built purely
-- from migrations were broken.

-- Work-order status change trigger dependency — user-context trigger call
GRANT EXECUTE ON FUNCTION public.queue_notification(uuid, text, jsonb)
  TO anon, authenticated, service_role;

-- Notification consumer (pg_cron runs as postgres; service_role may invoke)
GRANT EXECUTE ON FUNCTION public.process_notification_queue()
  TO anon, authenticated, service_role;

-- RBAC / row-level guard trigger functions
GRANT EXECUTE ON FUNCTION public.prevent_delete_role_with_members()
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prevent_system_role_mutation()
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prevent_system_role_perm_change()
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_membership_role_org()
  TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_role_permission_org()
  TO service_role;

-- Org/onboarding RPCs called server-side with the service role
GRANT EXECUTE ON FUNCTION public.seed_org_permissions(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_org_role_permissions(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.renew_organization_subscription(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.set_primary_organization(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.lookup_invite_by_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_refund_atomically(
  uuid, uuid, numeric, text, text, text, text, uuid
) TO anon, authenticated, service_role;

-- Device/clock flows (service role; authenticated used the PIN RPCs below)
GRANT EXECUTE ON FUNCTION public.register_mechanic_device(uuid, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.register_mechanic_device(uuid, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_mechanic_device(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_clock_token(text, uuid) TO service_role;

-- Bay view PIN + inventory balance maintenance
GRANT EXECUTE ON FUNCTION public.set_organization_bay_view_pin(uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_organization_bay_view_pin(uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_inventory_balance(uuid) TO service_role;
