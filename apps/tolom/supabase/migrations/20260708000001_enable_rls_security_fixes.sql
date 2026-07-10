-- Migration: P0 Security Fixes — Enable RLS on 5 exposed tables
-- These tables had RLS disabled, meaning any authenticated user could read/write all rows.
-- This is a critical security vulnerability, especially for custom_bots (contains bot_token_hash).

-- ============================================================
-- 1. agent_audit_log — append-only audit trail
-- ============================================================
ALTER TABLE agent_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_audit_log_select" ON agent_audit_log;
CREATE POLICY "agent_audit_log_select" ON agent_audit_log
  FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "agent_audit_log_insert" ON agent_audit_log;
CREATE POLICY "agent_audit_log_insert" ON agent_audit_log
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- No UPDATE or DELETE — this is an immutable audit log


-- ============================================================
-- 2. agent_daily_spend — immutable daily aggregates
-- ============================================================
ALTER TABLE agent_daily_spend ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_daily_spend_select" ON agent_daily_spend;
CREATE POLICY "agent_daily_spend_select" ON agent_daily_spend
  FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "agent_daily_spend_insert" ON agent_daily_spend;
CREATE POLICY "agent_daily_spend_insert" ON agent_daily_spend
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- No UPDATE or DELETE — immutable daily aggregates


-- ============================================================
-- 3. agent_sessions — full CRUD (sessions need lifecycle)
-- ============================================================
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_sessions_select" ON agent_sessions;
CREATE POLICY "agent_sessions_select" ON agent_sessions
  FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "agent_sessions_insert" ON agent_sessions;
CREATE POLICY "agent_sessions_insert" ON agent_sessions
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "agent_sessions_update" ON agent_sessions;
CREATE POLICY "agent_sessions_update" ON agent_sessions
  FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "agent_sessions_delete" ON agent_sessions;
CREATE POLICY "agent_sessions_delete" ON agent_sessions
  FOR DELETE
  USING (organization_id = get_user_organization_id());


-- ============================================================
-- 4. custom_bots — full CRUD (bot management)
-- NOTE: bot_token_hash is sensitive. RLS restricts access to org members.
-- The app layer should never expose bot_token_hash to the client.
-- ============================================================
ALTER TABLE custom_bots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_bots_select" ON custom_bots;
CREATE POLICY "custom_bots_select" ON custom_bots
  FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "custom_bots_insert" ON custom_bots;
CREATE POLICY "custom_bots_insert" ON custom_bots
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "custom_bots_update" ON custom_bots;
CREATE POLICY "custom_bots_update" ON custom_bots
  FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "custom_bots_delete" ON custom_bots;
CREATE POLICY "custom_bots_delete" ON custom_bots
  FOR DELETE
  USING (organization_id = get_user_organization_id());


-- ============================================================
-- 5. one_time_tokens — SELECT only (INSERT/UPDATE/DELETE via SECURITY DEFINER RPCs)
-- ============================================================
ALTER TABLE one_time_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "one_time_tokens_select" ON one_time_tokens;
CREATE POLICY "one_time_tokens_select" ON one_time_tokens
  FOR SELECT
  USING (organization_id = get_user_organization_id());

-- No INSERT/UPDATE/DELETE policies — these are created by SECURITY DEFINER functions


-- ============================================================
-- 6. Security DEFINER audit — helper function for future audits
-- ============================================================
CREATE OR REPLACE FUNCTION audit_security_definer_functions()
RETURNS TABLE(
  function_name text,
  arguments text,
  has_auth_uid_check boolean,
  has_search_path_set boolean,
  return_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.proname::text,
    pg_catalog.pg_get_function_arguments(p.oid)::text,
    (pg_catalog.pg_get_functiondef(p.oid) LIKE '%auth.uid()%')::boolean,
    (pg_catalog.pg_get_functiondef(p.oid) LIKE '%search_path%')::boolean,
    pg_catalog.pg_get_function_result(p.oid)::text
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prosecdef = true
  ORDER BY p.proname;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- Convenience view
DROP VIEW IF EXISTS v_security_definer_audit;
CREATE VIEW v_security_definer_audit AS
SELECT * FROM audit_security_definer_functions();
