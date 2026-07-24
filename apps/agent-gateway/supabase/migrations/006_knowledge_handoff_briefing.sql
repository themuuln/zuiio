-- 006_knowledge_handoff_briefing.sql
-- Knowledge base, human handoff, customer memory, and daily briefing

-- Enable pgvector for knowledge base embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base sources
CREATE TABLE IF NOT EXISTS agent_knowledge_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  source_type     text NOT NULL CHECK (source_type IN ('url', 'document', 'faq', 'catalog', 'manual')),
  title           text,
  content         text NOT NULL,
  embedding       vector(1536), -- DeepSeek/OpenAI embedding dimension
  url             text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_org
  ON agent_knowledge_sources(organization_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
  ON agent_knowledge_sources USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Human handoff events
CREATE TYPE handoff_status AS ENUM (
  'bot',             -- Normal bot conversation
  'pending_human',   -- Waiting for human to pick up
  'human_active',    -- Human is responding
  'human_resolved',  -- Human resolved and handed back
  'bot_resumed'      -- Bot resumed after human resolution
);

CREATE TABLE IF NOT EXISTS agent_handoff_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  chat_id         bigint NOT NULL,
  user_id         bigint NOT NULL,
  status          handoff_status NOT NULL DEFAULT 'bot',
  reason          text,           -- Why the handoff was triggered
  escalated_by   text,           -- 'keyword', 'intent', 'sentiment', 'agent'
  customer_query  text,           -- The query that triggered the handoff
  bot_response    text,           -- What the bot said before handing off
  admin_chat_id   bigint,         -- Where the admin is notified
  admin_user_id   bigint,         -- Which admin is handling the escalation
  resolved_at     timestamptz,    -- When the human resolved it
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handoff_org_status
  ON agent_handoff_events(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_handoff_chat
  ON agent_handoff_events(chat_id, created_at DESC);

-- Customer memory (cross-session facts about specific customers)
CREATE TABLE IF NOT EXISTS agent_customer_memory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  customer_id     text NOT NULL,
  customer_name   text,
  fact            text NOT NULL,    -- A single remembered fact
  fact_type       text NOT NULL DEFAULT 'general', -- 'preference', 'contact', 'purchase', 'issue', 'note'
  source_chat_id  bigint,           -- Which conversation this came from
  confidence      float NOT NULL DEFAULT 1.0, -- How confident we are in this fact
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_memory_org_customer
  ON agent_customer_memory(organization_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_memory_org_fact
  ON agent_customer_memory(organization_id, fact_type);

-- Daily briefing delivery log
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

CREATE INDEX IF NOT EXISTS idx_briefing_org
  ON agent_briefing_log(organization_id, delivered_at DESC);

-- Handoff trigger configuration per organization
CREATE TABLE IF NOT EXISTS agent_handoff_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  keyword_triggers text[],           -- Words that trigger handoff
  sentiment_enabled boolean DEFAULT true,
  low_confidence_threshold float DEFAULT 0.6, -- Confidence below this triggers handoff
  admin_chat_id    bigint,           -- Telegram chat ID of admin to notify
  auto_handoff_after_hours boolean DEFAULT true, -- Auto-handoff when agents are offline
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Proactive notification triggers
CREATE TABLE IF NOT EXISTS agent_notification_triggers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  trigger_type    text NOT NULL,      -- 'invoice_due', 'work_order_ready', 'payment_received', 'custom'
  trigger_config  jsonb NOT NULL DEFAULT '{}',
  message_template text,
  is_active       boolean DEFAULT true,
  last_fired_at   timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_triggers_org
  ON agent_notification_triggers(organization_id, trigger_type);

-- Search function for knowledge base using pgvector similarity
CREATE OR REPLACE FUNCTION search_agent_knowledge(
  p_org_id uuid,
  p_query_embedding vector(1536),
  p_limit integer DEFAULT 5,
  p_similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  source_type text,
  title text,
  content text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.source_type,
    k.title,
    k.content,
    1 - (k.embedding <=> p_query_embedding) AS similarity
  FROM agent_knowledge_sources k
  WHERE k.organization_id = p_org_id
    AND k.is_active = true
    AND k.embedding IS NOT NULL
    AND 1 - (k.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY k.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get active handoff for a chat
CREATE OR REPLACE FUNCTION get_active_handoff(
  p_org_id uuid,
  p_chat_id bigint
)
RETURNS TABLE (
  id uuid,
  status handoff_status,
  reason text,
  escalated_by text,
  customer_query text,
  admin_user_id bigint,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.status,
    h.reason,
    h.escalated_by,
    h.customer_query,
    h.admin_user_id,
    h.created_at
  FROM agent_handoff_events h
  WHERE h.organization_id = p_org_id
    AND h.chat_id = p_chat_id
    AND h.status IN ('pending_human', 'human_active')
  ORDER BY h.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
