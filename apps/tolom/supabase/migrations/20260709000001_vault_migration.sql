-- Migration: Vault integration for app_config secrets
-- Encrypted storage via Supabase Vault with backward-compat view
-- app_config preserved during transition — delete after consumers migrate

-- 1. Store a secret in Vault (upsert by name)
CREATE OR REPLACE FUNCTION vault_store_secret(p_key text, p_value text)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = p_key) THEN
    PERFORM vault.update_secret(p_key, p_value);
  ELSE
    PERFORM vault.create_secret(p_value, p_key, 'migrated from app_config');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Read a secret from Vault
CREATE OR REPLACE FUNCTION vault_get_secret(p_key text)
RETURNS text
STABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT decrypted_secret
    FROM vault.decrypted_secrets
    WHERE name = p_key
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Migrate a single key from app_config → Vault
CREATE OR REPLACE FUNCTION vault_migrate_from_app_config(p_key text)
RETURNS boolean
SET search_path = 'public'
AS $$
DECLARE
  v_value text;
BEGIN
  SELECT value INTO v_value FROM public.app_config WHERE key = p_key;
  IF v_value IS NOT NULL THEN
    PERFORM vault_store_secret(p_key, v_value);
    RAISE NOTICE 'Migrated % to Vault', p_key;
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Migrate all app_config secrets to Vault
CREATE OR REPLACE FUNCTION vault_migrate_all_secrets()
RETURNS integer
SET search_path = 'public'
AS $$
DECLARE
  r record;
  v_migrated integer := 0;
BEGIN
  FOR r IN SELECT key FROM public.app_config LOOP
    IF vault_migrate_from_app_config(r.key) THEN
      v_migrated := v_migrated + 1;
    END IF;
  END LOOP;
  RAISE NOTICE 'Migrated % secrets to Vault', v_migrated;
  RETURN v_migrated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Backward-compat view: Vault secrets with app_config fallback
CREATE OR REPLACE VIEW app_config_view AS
SELECT
  ac.key,
  COALESCE(
    vault_get_secret(ac.key),
    ac.value
  ) AS value,
  ac.updated_at,
  (vault_get_secret(ac.key) IS NOT NULL) AS in_vault
FROM public.app_config ac;

-- 6. Grants for service_role (edge functions) and authenticated (read-only)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.app_config_view TO service_role;
GRANT EXECUTE ON FUNCTION vault_store_secret(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION vault_get_secret(text) TO service_role;
GRANT EXECUTE ON FUNCTION vault_migrate_from_app_config(text) TO service_role;
GRANT EXECUTE ON FUNCTION vault_migrate_all_secrets() TO service_role;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.app_config_view TO authenticated;
-- NOTE: vault_get_secret is intentionally NOT granted to authenticated role.
-- Secrets must only be accessed via service_role in edge functions.
-- GRANT EXECUTE ON FUNCTION vault_get_secret(text) TO authenticated;

-- Migration workflow:
-- 1. Run: SELECT public.vault_migrate_all_secrets();
-- 2. Verify: SELECT key, in_vault FROM app_config_view;
-- 3. Update consumers to use app_config_view or vault_get_secret()
-- 4. Once all code is updated, drop app_config table
