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