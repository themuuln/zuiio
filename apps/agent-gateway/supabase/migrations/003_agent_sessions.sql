-- 003_agent_sessions.sql
-- Session persistence and daily spend tracking for the agent gateway

-- Conversation session store (per tenant + chat + user)
CREATE TABLE IF NOT EXISTS agent_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL,
  telegram_chat_id  bigint NOT NULL,
  telegram_user_id  bigint NOT NULL,
  messages          jsonb NOT NULL DEFAULT '[]',
  token_count       integer NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  expires_at        timestamptz,

  UNIQUE(organization_id, telegram_chat_id, telegram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_org
  ON agent_sessions(organization_id);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_updated
  ON agent_sessions(updated_at);

-- Daily spend tracking (per organization + date)
CREATE TABLE IF NOT EXISTS agent_daily_spend (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  date            date NOT NULL,
  tokens_used     bigint NOT NULL DEFAULT 0,
  api_calls       integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE(organization_id, date)
);

CREATE INDEX IF NOT EXISTS idx_agent_daily_spend_org_date
  ON agent_daily_spend(organization_id, date);

-- Atomic daily spend increment (avoids race conditions on concurrent requests)
CREATE OR REPLACE FUNCTION increment_daily_spend(
  p_org_id uuid,
  p_date date,
  p_tokens bigint
) RETURNS void AS $$
BEGIN
  INSERT INTO agent_daily_spend (organization_id, date, tokens_used, api_calls)
  VALUES (p_org_id, p_date, p_tokens, 1)
  ON CONFLICT (organization_id, date)
  DO UPDATE SET
    tokens_used = agent_daily_spend.tokens_used + p_tokens,
    api_calls = agent_daily_spend.api_calls + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Agent audit log (tracks every tool call for security + debugging)
CREATE TABLE IF NOT EXISTS agent_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id         text NOT NULL,
  chat_id         bigint NOT NULL,
  telegram_user_id bigint NOT NULL,
  tool_name       text NOT NULL,
  tool_args       jsonb,
  tool_result     jsonb,
  error           text,
  duration_ms     integer,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_log_org
  ON agent_audit_log(organization_id, created_at DESC);
