-- Fix SECURITY DEFINER function warnings.
-- REVOKE EXECUTE from authenticated for functions that should only be called
-- server-side (API routes use service_role, which bypasses RLS).
-- Functions that RLS policies call (get_user_organization_id) stay accessible.

-- Vault functions — server-side only
REVOKE EXECUTE ON FUNCTION public.vault_get_secret(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.vault_store_secret(text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.vault_migrate_all_secrets() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.vault_migrate_from_app_config(text) FROM authenticated;

-- Admin/RBAC operations — server-side only
REVOKE EXECUTE ON FUNCTION public.seed_org_permissions(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_org_role_permissions(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.renew_organization_subscription(uuid) FROM authenticated;

-- Device management — server-side only (called from API routes)
REVOKE EXECUTE ON FUNCTION public.register_mechanic_device(uuid, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.register_mechanic_device(uuid, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_mechanic_device(uuid) FROM authenticated;

-- Inventory operations — server-side only
REVOKE EXECUTE ON FUNCTION public.refresh_inventory_balance(uuid) FROM authenticated;

-- Clock token verification — server-side only
REVOKE EXECUTE ON FUNCTION public.verify_clock_token(text, uuid) FROM authenticated;

-- Trigger function — shouldn't be callable directly
REVOKE EXECUTE ON FUNCTION public.trg_inventory_movement_sync() FROM authenticated;

-- RBAC validators — internal, called by other SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.validate_membership_role_org() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_role_permission_org() FROM authenticated;

-- Bay view pin — server-side only (called from API routes)
REVOKE EXECUTE ON FUNCTION public.set_organization_bay_view_pin(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_organization_bay_view_pin(uuid, text) FROM authenticated;

-- Organization switching — server-side only
REVOKE EXECUTE ON FUNCTION public.set_primary_organization(uuid) FROM authenticated;