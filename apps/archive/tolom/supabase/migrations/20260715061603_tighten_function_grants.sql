-- Tighten grants: only postgres (owner) and service_role should execute these.
-- Revoke from anon too for truly sensitive functions.

-- Vault — only service_role + owner
REVOKE EXECUTE ON FUNCTION public.vault_get_secret(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vault_store_secret(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vault_migrate_all_secrets() FROM anon;
REVOKE EXECUTE ON FUNCTION public.vault_migrate_from_app_config(text) FROM anon;

-- Admin operations — only service_role + owner
REVOKE EXECUTE ON FUNCTION public.seed_org_permissions(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.seed_org_role_permissions(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.renew_organization_subscription(uuid) FROM anon;

-- Device management — only service_role + owner
REVOKE EXECUTE ON FUNCTION public.register_mechanic_device(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_mechanic_device(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_mechanic_device(uuid) FROM anon;

-- Inventory — only service_role + owner
REVOKE EXECUTE ON FUNCTION public.refresh_inventory_balance(uuid) FROM anon;

-- Clock token — only service_role + owner
REVOKE EXECUTE ON FUNCTION public.verify_clock_token(text, uuid) FROM anon;

-- Trigger — only postgres
REVOKE EXECUTE ON FUNCTION public.trg_inventory_movement_sync() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_inventory_movement_sync() FROM service_role;

-- RBAC validators — only service_role + owner
REVOKE EXECUTE ON FUNCTION public.validate_membership_role_org() FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_role_permission_org() FROM anon;

-- Bay view pin — only service_role + owner
REVOKE EXECUTE ON FUNCTION public.set_organization_bay_view_pin(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_organization_bay_view_pin(uuid, text) FROM anon;

-- Org switching — only service_role + owner
REVOKE EXECUTE ON FUNCTION public.set_primary_organization(uuid) FROM anon;