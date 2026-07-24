-- 009_agent_context_profiles.sql
-- Adaptive agent context: per-org audience profiles, knowledge visibility,
-- and channel-audience resolution.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Table: agent_context_profiles
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agent_context_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL,
  audience         text NOT NULL CHECK (audience IN ('internal', 'customer')),
  assistant_name   text,
  business_summary text,
  response_language text DEFAULT 'mn',
  tone             text CHECK (tone IN ('professional', 'friendly', 'formal', 'casual')),
  contact_details  text,
  business_hours   jsonb,
  response_rules   text,
  handoff_message  text,
  is_active        boolean DEFAULT true,
  updated_by       text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),

  UNIQUE(organization_id, audience)
);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_org
  ON agent_context_profiles(organization_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Add visibility column to agent_knowledge_sources
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE agent_knowledge_sources
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'internal'
  CHECK (visibility IN ('internal', 'customer', 'both'));

-- Backfill existing rows to 'both' so they remain accessible to all audiences
UPDATE agent_knowledge_sources
SET visibility = 'both'
WHERE visibility IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Add audience column to channel_connections
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE channel_connections
  ADD COLUMN IF NOT EXISTS audience text CHECK (audience IN ('internal', 'customer'));

-- Backfill: Telegram channels with a SSO-linked user_id → internal, others → customer
UPDATE channel_connections
SET audience = CASE
  WHEN channel = 'telegram' AND user_id IS NOT NULL THEN 'internal'
  ELSE 'customer'
END
WHERE audience IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE channel_connections
  ALTER COLUMN audience SET DEFAULT 'customer';

ALTER TABLE channel_connections
  ALTER COLUMN audience SET NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Enable RLS + FORCE on agent_context_profiles
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.agent_context_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_context_profiles FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Policies — 4 per table (SELECT, INSERT, UPDATE, DELETE)
--    Uses get_user_organization_id() which is SECURITY DEFINER and stable.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── agent_context_profiles ──────────────────────────────────────────────────

DROP POLICY IF EXISTS agent_context_profiles_select ON public.agent_context_profiles;
CREATE POLICY agent_context_profiles_select
  ON public.agent_context_profiles FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS agent_context_profiles_insert ON public.agent_context_profiles;
CREATE POLICY agent_context_profiles_insert
  ON public.agent_context_profiles FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS agent_context_profiles_update ON public.agent_context_profiles;
CREATE POLICY agent_context_profiles_update
  ON public.agent_context_profiles FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS agent_context_profiles_delete ON public.agent_context_profiles;
CREATE POLICY agent_context_profiles_delete
  ON public.agent_context_profiles FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Grant service_role full access to agent_context_profiles
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.agent_context_profiles
  TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. Updated_at trigger (same pattern as channel_connections)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_agent_context_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agent_context_profiles_updated_at ON agent_context_profiles;
CREATE TRIGGER trigger_agent_context_profiles_updated_at
  BEFORE UPDATE ON agent_context_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_context_profiles_updated_at();
