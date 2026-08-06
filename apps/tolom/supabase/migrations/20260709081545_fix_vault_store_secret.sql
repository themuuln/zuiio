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