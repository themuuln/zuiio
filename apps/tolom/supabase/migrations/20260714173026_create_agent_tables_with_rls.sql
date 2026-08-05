-- Create agent_* tables (from 006) + enable RLS + create policies (from 008)
-- Combined because 006 was never applied to this project.

CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agent_knowledge_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  source_type     text NOT NULL CHECK (source_type IN ('url', 'document', 'faq', 'catalog', 'manual')),
  title           text,
  content         text NOT NULL,
  embedding       vector(1536),
  url             text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_org ON agent_knowledge_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON agent_knowledge_sources USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

DO $$ BEGIN
  CREATE TYPE handoff_status AS ENUM ('bot', 'pending_human', 'human_active', 'human_resolved', 'bot_resumed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS agent_handoff_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  chat_id         bigint NOT NULL,
  user_id         bigint NOT NULL,
  status          handoff_status NOT NULL DEFAULT 'bot',
  reason          text,
  escalated_by   text,
  customer_query  text,
  bot_response    text,
  admin_chat_id   bigint,
  admin_user_id   bigint,
  resolved_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handoff_org_status ON agent_handoff_events(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_handoff_chat ON agent_handoff_events(chat_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_customer_memory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  customer_id     text NOT NULL,
  customer_name   text,
  fact            text NOT NULL,
  fact_type       text NOT NULL DEFAULT 'general',
  source_chat_id  bigint,
  confidence      float NOT NULL DEFAULT 1.0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_memory_org_customer ON agent_customer_memory(organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_memory_org_fact ON agent_customer_memory(organization_id, fact_type);

CREATE TABLE IF NOT EXISTS agent_briefing_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  admin_chat_id   bigint NOT NULL,
  briefing_text   text NOT NULL,
  overnight_messages integer DEFAULT 0,
  overnight_tool_calls integer DEFAULT 0,
  pending_handoffs integer DEFAULT 0,
  events_summary  jsonb,
  delivered_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_org ON agent_briefing_log(organization_id, delivered_at DESC);

CREATE TABLE IF NOT EXISTS agent_handoff_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  keyword_triggers text[],
  sentiment_enabled boolean DEFAULT true,
  low_confidence_threshold float DEFAULT 0.6,
  admin_chat_id    bigint,
  auto_handoff_after_hours boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_notification_triggers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  trigger_type    text NOT NULL,
  trigger_config  jsonb NOT NULL DEFAULT '{}',
  message_template text,
  is_active       boolean DEFAULT true,
  last_fired_at   timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_triggers_org ON agent_notification_triggers(organization_id, trigger_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ENABLE RLS + FORCE
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.agent_knowledge_sources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_handoff_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_customer_memory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_briefing_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_handoff_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notification_triggers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agent_knowledge_sources    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_handoff_events       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_customer_memory      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_briefing_log         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_handoff_config       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notification_triggers FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- POLICIES (4 per table: SELECT, INSERT, UPDATE, DELETE)
-- ═══════════════════════════════════════════════════════════════════════════════

-- agent_knowledge_sources
DROP POLICY IF EXISTS agent_knowledge_sources_select ON public.agent_knowledge_sources;
CREATE POLICY agent_knowledge_sources_select ON public.agent_knowledge_sources FOR SELECT USING (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_knowledge_sources_insert ON public.agent_knowledge_sources;
CREATE POLICY agent_knowledge_sources_insert ON public.agent_knowledge_sources FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_knowledge_sources_update ON public.agent_knowledge_sources;
CREATE POLICY agent_knowledge_sources_update ON public.agent_knowledge_sources FOR UPDATE USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_knowledge_sources_delete ON public.agent_knowledge_sources;
CREATE POLICY agent_knowledge_sources_delete ON public.agent_knowledge_sources FOR DELETE USING (organization_id = get_user_organization_id());

-- agent_handoff_events
DROP POLICY IF EXISTS agent_handoff_events_select ON public.agent_handoff_events;
CREATE POLICY agent_handoff_events_select ON public.agent_handoff_events FOR SELECT USING (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_handoff_events_insert ON public.agent_handoff_events;
CREATE POLICY agent_handoff_events_insert ON public.agent_handoff_events FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_handoff_events_update ON public.agent_handoff_events;
CREATE POLICY agent_handoff_events_update ON public.agent_handoff_events FOR UPDATE USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_handoff_events_delete ON public.agent_handoff_events;
CREATE POLICY agent_handoff_events_delete ON public.agent_handoff_events FOR DELETE USING (organization_id = get_user_organization_id());

-- agent_customer_memory
DROP POLICY IF EXISTS agent_customer_memory_select ON public.agent_customer_memory;
CREATE POLICY agent_customer_memory_select ON public.agent_customer_memory FOR SELECT USING (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_customer_memory_insert ON public.agent_customer_memory;
CREATE POLICY agent_customer_memory_insert ON public.agent_customer_memory FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_customer_memory_update ON public.agent_customer_memory;
CREATE POLICY agent_customer_memory_update ON public.agent_customer_memory FOR UPDATE USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_customer_memory_delete ON public.agent_customer_memory;
CREATE POLICY agent_customer_memory_delete ON public.agent_customer_memory FOR DELETE USING (organization_id = get_user_organization_id());

-- agent_briefing_log
DROP POLICY IF EXISTS agent_briefing_log_select ON public.agent_briefing_log;
CREATE POLICY agent_briefing_log_select ON public.agent_briefing_log FOR SELECT USING (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_briefing_log_insert ON public.agent_briefing_log;
CREATE POLICY agent_briefing_log_insert ON public.agent_briefing_log FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_briefing_log_update ON public.agent_briefing_log;
CREATE POLICY agent_briefing_log_update ON public.agent_briefing_log FOR UPDATE USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_briefing_log_delete ON public.agent_briefing_log;
CREATE POLICY agent_briefing_log_delete ON public.agent_briefing_log FOR DELETE USING (organization_id = get_user_organization_id());

-- agent_handoff_config
DROP POLICY IF EXISTS agent_handoff_config_select ON public.agent_handoff_config;
CREATE POLICY agent_handoff_config_select ON public.agent_handoff_config FOR SELECT USING (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_handoff_config_insert ON public.agent_handoff_config;
CREATE POLICY agent_handoff_config_insert ON public.agent_handoff_config FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_handoff_config_update ON public.agent_handoff_config;
CREATE POLICY agent_handoff_config_update ON public.agent_handoff_config FOR UPDATE USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_handoff_config_delete ON public.agent_handoff_config;
CREATE POLICY agent_handoff_config_delete ON public.agent_handoff_config FOR DELETE USING (organization_id = get_user_organization_id());

-- agent_notification_triggers
DROP POLICY IF EXISTS agent_notification_triggers_select ON public.agent_notification_triggers;
CREATE POLICY agent_notification_triggers_select ON public.agent_notification_triggers FOR SELECT USING (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_notification_triggers_insert ON public.agent_notification_triggers;
CREATE POLICY agent_notification_triggers_insert ON public.agent_notification_triggers FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_notification_triggers_update ON public.agent_notification_triggers;
CREATE POLICY agent_notification_triggers_update ON public.agent_notification_triggers FOR UPDATE USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());
DROP POLICY IF EXISTS agent_notification_triggers_delete ON public.agent_notification_triggers;
CREATE POLICY agent_notification_triggers_delete ON public.agent_notification_triggers FOR DELETE USING (organization_id = get_user_organization_id());