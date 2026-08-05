-- Fix SECURITY DEFINER function warnings — revoke from PUBLIC (not just authenticated).
-- The functions had =X/postgres (PUBLIC EXECUTE) which grants access to all roles.

-- Vault functions
REVOKE EXECUTE ON FUNCTION public.vault_get_secret(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vault_store_secret(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vault_migrate_all_secrets() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vault_migrate_from_app_config(text) FROM PUBLIC;

-- Admin/RBAC operations
REVOKE EXECUTE ON FUNCTION public.seed_org_permissions(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.seed_org_role_permissions(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.renew_organization_subscription(uuid) FROM PUBLIC;

-- Device management
REVOKE EXECUTE ON FUNCTION public.register_mechanic_device(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_mechanic_device(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_mechanic_device(uuid) FROM PUBLIC;

-- Inventory operations
REVOKE EXECUTE ON FUNCTION public.refresh_inventory_balance(uuid) FROM PUBLIC;

-- Clock token verification
REVOKE EXECUTE ON FUNCTION public.verify_clock_token(text, uuid) FROM PUBLIC;

-- Trigger function
REVOKE EXECUTE ON FUNCTION public.trg_inventory_movement_sync() FROM PUBLIC;

-- RBAC validators
REVOKE EXECUTE ON FUNCTION public.validate_membership_role_org() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_role_permission_org() FROM PUBLIC;

-- Bay view pin
REVOKE EXECUTE ON FUNCTION public.set_organization_bay_view_pin(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_organization_bay_view_pin(uuid, text) FROM PUBLIC;

-- Organization switching
REVOKE EXECUTE ON FUNCTION public.set_primary_organization(uuid) FROM PUBLIC;

-- Additional functions found in second scan
REVOKE EXECUTE ON FUNCTION public.lookup_invite_by_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_delete_role_with_members() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_system_role_mutation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_system_role_perm_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_notification_queue() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.queue_notification(uuid, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_refund_atomically(uuid, uuid, numeric, text, text, text, text, uuid) FROM PUBLIC;